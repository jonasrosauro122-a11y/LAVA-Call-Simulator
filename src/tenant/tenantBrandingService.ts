import { eventBus } from '../platform/eventBus';
import { tenantEngine } from './tenantEngine';
import type { TenantContext, TenantBranding } from './types';
import { DEFAULT_BRANDING } from './defaults';

/**
 * TenantBrandingService — per-tenant white-label (logo, colors, typography, login &
 * dashboard branding, certificate/email branding, custom-domain-ready). Reads/writes the
 * branding block on the tenant record and publishes BrandingUpdated.
 */
class TenantBrandingService {
  get(ctx: TenantContext): TenantBranding { return ctx.tenant?.branding ?? { ...DEFAULT_BRANDING }; }

  set(ctx: TenantContext, patch: Partial<TenantBranding>): void {
    const t = tenantEngine.get(ctx.tenantId);
    if (!t) return;
    tenantEngine.update(ctx.tenantId, { branding: { ...t.branding, ...patch } });
    void eventBus.publish('BrandingUpdated', { tenantId: ctx.tenantId, keys: Object.keys(patch) }, { source: 'tenantBranding', metadata: { target: ctx.tenantId } });
  }

  // For future :root injection per tenant; components keep using design tokens today.
  resolveCssVars(ctx: TenantContext): Record<string, string> {
    const b = this.get(ctx);
    return { '--brand-primary': b.primaryColor, '--brand-secondary': b.secondaryColor, '--brand-font': b.fontFamily };
  }
}

export const tenantBrandingService = new TenantBrandingService();
