import { tenantEngine } from './tenantEngine';
import type { TenantContext } from './types';

const CURRENT_KEY = 'lava_current_tenant';

/**
 * TenantResolver — determines the active tenant. In production the tenant is resolved
 * from the request host (subdomain / custom domain) or an authenticated session claim;
 * today it falls back to a stored selection or 'default'. resolveFromHost implements the
 * host-matching rule so the server-side version only changes where `host` comes from.
 */
class TenantResolver {
  resolveFromHost(host: string): string {
    for (const t of tenantEngine.list()) {
      if (t.domains.some((d) => d.host.toLowerCase() === host.toLowerCase())) return t.id;
    }
    // subdomain heuristic: {slug}.lava.app
    const sub = host.split('.')[0];
    const bySlug = tenantEngine.list().find((t) => t.slug === sub);
    return bySlug?.id ?? 'default';
  }

  currentId(): string {
    try { return localStorage.getItem(CURRENT_KEY) || 'default'; } catch { return 'default'; }
  }

  setCurrent(id: string): void {
    try { localStorage.setItem(CURRENT_KEY, id); } catch { /* ignore */ }
  }

  current(): TenantContext {
    return tenantEngine.contextFor(this.currentId());
  }

  contextFor(id: string): TenantContext {
    return tenantEngine.contextFor(id);
  }
}

export const tenantResolver = new TenantResolver();

/**
 * TenantStorage — namespaced key/value isolation. Every key is prefixed with the tenant
 * id so two tenants can never read each other's local data. This mirrors exactly how
 * row-level security will scope by tenant_id server-side: same key shape, enforced lower.
 */
export const tenantStorage = {
  scopedKey(ctx: TenantContext, key: string): string { return `t:${ctx.tenantId}:${key}`; },
  get(ctx: TenantContext, key: string): string | null {
    try { return localStorage.getItem(this.scopedKey(ctx, key)); } catch { return null; }
  },
  set(ctx: TenantContext, key: string, value: string): void {
    try { localStorage.setItem(this.scopedKey(ctx, key), value); } catch { /* ignore */ }
  },
  remove(ctx: TenantContext, key: string): void {
    try { localStorage.removeItem(this.scopedKey(ctx, key)); } catch { /* ignore */ }
  },
};
