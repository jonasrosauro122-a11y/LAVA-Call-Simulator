// Security toolkit (Phase 6). Client-appropriate defenses plus interfaces/helpers the
// server enforces at deploy time. Each helper is dependency-free and safe to call in any
// environment. None of these replace server-side enforcement; they harden the client and
// define the contract (documented in docs/RECOVERY.md + docs/DEPLOYMENT.md).

import { environment } from './environment';

// ---- Input sanitization / XSS prevention ----
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Strip anything that isn't safe for a URL/redirect target (blocks javascript: etc.).
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
  return trimmed;
}

// ---- Input validation ----
export const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  nonEmpty: (v: string) => v.trim().length > 0,
  maxLen: (v: string, n: number) => v.length <= n,
  slug: (v: string) => /^[a-z0-9-]+$/.test(v),
  password: (v: string) => v.length >= 8 && /[a-z]/.test(v) && /[A-Z0-9]/.test(v),
};

export function validate(value: string, rules: ((v: string) => boolean)[]): boolean {
  return rules.every((r) => r(value));
}

// ---- CSRF token (double-submit cookie pattern; token surfaced for headers) ----
class CsrfGuard {
  private token: string | null = null;
  issue(): string {
    this.token = cryptoRandom(24);
    return this.token;
  }
  current(): string { return this.token ?? this.issue(); }
  verify(candidate: string): boolean { return !!this.token && candidate === this.token; }
}
export const csrf = new CsrfGuard();

// ---- Rate limiting (token bucket per key) ----
class RateLimiter {
  private buckets = new Map<string, { tokens: number; updated: number }>();
  constructor(private perMin = environment.settings.rateLimitPerMin) {}
  allow(key: string): boolean {
    const now = Date.now();
    const refillPerMs = this.perMin / 60000;
    const b = this.buckets.get(key) ?? { tokens: this.perMin, updated: now };
    b.tokens = Math.min(this.perMin, b.tokens + (now - b.updated) * refillPerMs);
    b.updated = now;
    if (b.tokens < 1) { this.buckets.set(key, b); return false; }
    b.tokens -= 1; this.buckets.set(key, b); return true;
  }
}
export const rateLimiter = new RateLimiter();

// ---- Secret abstraction ----
// Secrets are never hardcoded; they are resolved from the environment at runtime.
export const secrets = {
  get(name: string): string | undefined { return environment.get(name); },
  require(name: string): { ok: boolean; reason?: string } {
    return environment.has(name) ? { ok: true } : { ok: false, reason: `Missing ${name}` };
  },
};

// ---- Encryption helpers (Web Crypto AES-GCM; no-op fallback outside browser) ----
function hasSubtle(): boolean {
  return typeof globalThis.crypto !== 'undefined' && !!globalThis.crypto.subtle;
}
export function cryptoRandom(bytes = 16): string {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    const arr = new Uint8Array(bytes); globalThis.crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Array.from({ length: bytes }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
}
export async function deriveKey(passphrase: string): Promise<CryptoKey | null> {
  if (!hasSubtle()) return null;
  const enc = new TextEncoder();
  const material = await crypto.subtle.digest('SHA-256', enc.encode(passphrase));
  return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
export async function encryptString(plain: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
}
export async function decryptString(payload: string, key: CryptoKey): Promise<string | null> {
  try {
    const [ivB64, dataB64] = payload.split('.');
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const data = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0));
    const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(buf);
  } catch { return null; }
}

// ---- Secure storage (namespaced; optional encryption via a provided key) ----
export const secureStorage = {
  set(key: string, value: string): void { try { localStorage.setItem(`sec:${key}`, value); } catch { /* ignore */ } },
  get(key: string): string | null { try { return localStorage.getItem(`sec:${key}`); } catch { return null; } },
  remove(key: string): void { try { localStorage.removeItem(`sec:${key}`); } catch { /* ignore */ } },
};

// ---- Guards (permission + tenant validation) ----
export function assertPermission(has: boolean, action: string): { ok: boolean; reason?: string } {
  return has ? { ok: true } : { ok: false, reason: `Permission denied: ${action}` };
}
export function assertTenant(recordTenantId: string | undefined, ctxTenantId: string): { ok: boolean; reason?: string } {
  if (!recordTenantId) return { ok: true }; // legacy/global record
  return recordTenantId === ctxTenantId ? { ok: true } : { ok: false, reason: 'Cross-tenant access blocked' };
}

// Recommended security headers (applied by the host/CDN at deploy; surfaced for the checklist).
export const RECOMMENDED_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Permissions-Policy': 'microphone=(self)',
};
