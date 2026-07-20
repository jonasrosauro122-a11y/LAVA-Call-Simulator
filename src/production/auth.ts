import { eventBus } from '../platform/eventBus';
import { secureStorage, validators, cryptoRandom } from './security';
import { authExtensions } from '../tenant/authProviders';
import type { Role } from '../enterprise/types';

// Authentication (Phase 1). Provider-abstracted: a working LocalCredentialProvider backs
// email/password today; a Supabase or SSO provider drops in behind CredentialProvider with
// no change to consumers. Sessions are role- and tenant-aware and integrate with
// TenantContext. No email is actually sent — verification/reset tokens are issued and
// surfaced for the UI/logs (documented in docs/ADMIN_GUIDE.md).

export interface Session {
  userId: string;
  email: string;
  role: Role;
  tenantId: string;
  verified: boolean;
  expiresAt: string;
}

export interface AuthResult {
  ok: boolean;
  session?: Session;
  needsVerification?: boolean;
  token?: string; // verification/reset token (would be emailed in production)
  reason?: string;
}

interface StoredUser { id: string; email: string; passwordHash: string; role: Role; tenantId: string; verified: boolean; }

async function hash(input: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return `plain:${input}`; }
}

// The pluggable credential backend. Swap for Supabase Auth / SSO without touching AuthService.
export interface CredentialProvider {
  id: string;
  signUp(email: string, password: string, tenantId: string, role: Role): Promise<StoredUser>;
  verify(email: string, password: string): Promise<StoredUser | null>;
  find(email: string): StoredUser | undefined;
  update(email: string, patch: Partial<StoredUser>): void;
}

class LocalCredentialProvider implements CredentialProvider {
  id = 'local';
  private users = new Map<string, StoredUser>();
  async signUp(email: string, password: string, tenantId: string, role: Role): Promise<StoredUser> {
    const user: StoredUser = { id: `usr-${cryptoRandom(6)}`, email: email.toLowerCase(), passwordHash: await hash(password), role, tenantId, verified: false };
    this.users.set(user.email, user);
    return user;
  }
  async verify(email: string, password: string): Promise<StoredUser | null> {
    const u = this.users.get(email.toLowerCase());
    if (!u) return null;
    return u.passwordHash === await hash(password) ? u : null;
  }
  find(email: string): StoredUser | undefined { return this.users.get(email.toLowerCase()); }
  update(email: string, patch: Partial<StoredUser>): void {
    const u = this.users.get(email.toLowerCase()); if (u) this.users.set(u.email, { ...u, ...patch });
  }
}

const SESSION_KEY = 'auth_session';
const DAY = 86400000;

class AuthService {
  private provider: CredentialProvider = new LocalCredentialProvider();
  private tokens = new Map<string, { email: string; kind: 'verify' | 'reset' }>();

  setProvider(p: CredentialProvider): void { this.provider = p; }
  ssoProviders() { return authExtensions.list(); }

  async signUp(email: string, password: string, tenantId: string, role: Role = 'company_admin'): Promise<AuthResult> {
    if (!validators.email(email)) return { ok: false, reason: 'Invalid email' };
    if (!validators.password(password)) return { ok: false, reason: 'Password needs 8+ chars incl. upper/lower/number' };
    if (this.provider.find(email)) return { ok: false, reason: 'Account already exists' };
    await this.provider.signUp(email, password, tenantId, role);
    const token = cryptoRandom(16); this.tokens.set(token, { email, kind: 'verify' });
    void eventBus.publish('UserSignedUp', { email, tenantId }, { source: 'auth', metadata: { actor: email, target: tenantId } });
    return { ok: true, needsVerification: true, token };
  }

  verifyEmail(token: string): AuthResult {
    const t = this.tokens.get(token);
    if (!t || t.kind !== 'verify') return { ok: false, reason: 'Invalid or expired token' };
    this.provider.update(t.email, { verified: true }); this.tokens.delete(token);
    return { ok: true };
  }

  async signIn(email: string, password: string, remember = false): Promise<AuthResult> {
    const user = await this.provider.verify(email, password);
    if (!user) return { ok: false, reason: 'Invalid credentials' };
    const session: Session = {
      userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId, verified: user.verified,
      expiresAt: new Date(Date.now() + (remember ? 30 * DAY : DAY)).toISOString(),
    };
    secureStorage.set(SESSION_KEY, JSON.stringify(session));
    void eventBus.publish('UserSignedIn', { email: user.email, tenantId: user.tenantId }, { source: 'auth', metadata: { actor: user.email, target: user.tenantId } });
    return { ok: true, session };
  }

  requestPasswordReset(email: string): AuthResult {
    if (!this.provider.find(email)) return { ok: true }; // do not leak account existence
    const token = cryptoRandom(16); this.tokens.set(token, { email, kind: 'reset' });
    return { ok: true, token };
  }
  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    const t = this.tokens.get(token);
    if (!t || t.kind !== 'reset') return { ok: false, reason: 'Invalid or expired token' };
    if (!validators.password(newPassword)) return { ok: false, reason: 'Weak password' };
    this.provider.update(t.email, { passwordHash: await hash(newPassword) }); this.tokens.delete(token);
    return { ok: true };
  }

  currentSession(): Session | null {
    try {
      const raw = secureStorage.get(SESSION_KEY); if (!raw) return null;
      const s = JSON.parse(raw) as Session;
      if (new Date(s.expiresAt).getTime() < Date.now()) { this.signOut(); return null; }
      return s;
    } catch { return null; }
  }
  isAuthenticated(): boolean { return this.currentSession() !== null; }
  signOut(): void {
    const s = this.currentSession();
    secureStorage.remove(SESSION_KEY);
    void eventBus.publish('UserSignedOut', { email: s?.email }, { source: 'auth' });
  }

  configuredProviderId(): string { return this.provider.id; }
}

export const authService = new AuthService();
