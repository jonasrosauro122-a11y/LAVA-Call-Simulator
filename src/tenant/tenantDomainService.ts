import { tenantEngine } from './tenantEngine';
import type { TenantContext, TenantDomain, DomainKind } from './types';

/**
 * TenantDomainService — custom domain architecture (Feature 11). Registers subdomains
 * (company.lava.app) and custom domains (learn.company.com, academy.company.com). No DNS
 * or TLS work here; verification is a seam a future stage fills (DNS TXT / ACME).
 */
class TenantDomainService {
  list(ctx: TenantContext): TenantDomain[] { return ctx.tenant?.domains ?? []; }

  add(ctx: TenantContext, host: string, kind: DomainKind): void {
    const t = tenantEngine.get(ctx.tenantId); if (!t) return;
    if (t.domains.some((d) => d.host === host)) return;
    tenantEngine.update(ctx.tenantId, { domains: [...t.domains, { host, kind, verified: kind === 'subdomain' }] });
  }

  // Verification seam — real impl checks a DNS TXT record / ACME challenge.
  verify(ctx: TenantContext, host: string): boolean {
    const t = tenantEngine.get(ctx.tenantId); if (!t) return false;
    const domains = t.domains.map((d) => (d.host === host ? { ...d, verified: true } : d));
    tenantEngine.update(ctx.tenantId, { domains });
    return true;
  }

  remove(ctx: TenantContext, host: string): void {
    const t = tenantEngine.get(ctx.tenantId); if (!t) return;
    tenantEngine.update(ctx.tenantId, { domains: t.domains.filter((d) => d.host !== host) });
  }
}

export const tenantDomainService = new TenantDomainService();
