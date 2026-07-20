import type { AuthProviderKind, TenantContext } from './types';

export interface AuthProfile {
  subject: string;
  email: string;
  displayName?: string;
  tenantId: string;
}

// The interface every auth provider must satisfy. NOT implemented in this stage —
// beginLogin/handleCallback throw until a concrete provider is registered later.
export interface AuthProvider {
  kind: AuthProviderKind;
  isConfigured(): boolean;
  configure(config: Record<string, unknown>): void;
  beginLogin(ctx: TenantContext): Promise<{ redirectUrl: string }>;
  handleCallback(params: Record<string, string>): Promise<AuthProfile>;
}

export interface AuthProviderDefinition {
  kind: AuthProviderKind;
  name: string;
  protocol: 'oauth2' | 'oidc' | 'saml' | 'passwordless';
  available: boolean; // false = interface defined, provider not yet shipped
}

/**
 * AuthExtensionRegistry — declares the pluggable authentication surface (Google,
 * Microsoft, Okta, Azure AD, SAML, Magic Links, generic OAuth). This stage only defines
 * the catalog + interface; registering a concrete AuthProvider later flips it to
 * available with no change to tenant services.
 */
class AuthExtensionRegistry {
  private defs = new Map<AuthProviderKind, AuthProviderDefinition>();
  private providers = new Map<AuthProviderKind, AuthProvider>();

  define(def: AuthProviderDefinition): void { this.defs.set(def.kind, def); }
  registerProvider(provider: AuthProvider): void {
    this.providers.set(provider.kind, provider);
    const def = this.defs.get(provider.kind);
    if (def) def.available = true;
  }
  get(kind: AuthProviderKind): AuthProvider | undefined { return this.providers.get(kind); }
  list(): AuthProviderDefinition[] { return [...this.defs.values()]; }
}

export const authExtensions = new AuthExtensionRegistry();

// Seed the planned providers.
([
  ['google', 'Google SSO', 'oidc'],
  ['microsoft', 'Microsoft SSO', 'oidc'],
  ['okta', 'Okta', 'oidc'],
  ['azure_ad', 'Azure AD', 'oidc'],
  ['saml', 'SAML 2.0', 'saml'],
  ['magic_link', 'Magic Links', 'passwordless'],
  ['oauth', 'Generic OAuth', 'oauth2'],
] as [AuthProviderKind, string, AuthProviderDefinition['protocol']][])
  .forEach(([kind, name, protocol]) => authExtensions.define({ kind, name, protocol, available: false }));
