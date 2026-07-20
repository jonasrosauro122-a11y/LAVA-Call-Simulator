import { eventBus } from '../platform/eventBus';
import { subscriptionService } from './subscriptionService';
import type { TenantContext, TenantUsage, TenantLimits } from './types';

// Maps a usage metric to its limiting counterpart where one exists.
const USAGE_TO_LIMIT: Partial<Record<keyof TenantUsage, keyof TenantLimits>> = {
  users: 'maxUsers', simulations: 'maxSimulations', storageMb: 'storageMb',
  apiCalls: 'apiCalls', voiceMinutes: 'voiceMinutes', aiTokens: 'aiTokens',
};

export interface LimitViolation {
  metric: keyof TenantUsage;
  used: number;
  limit: number;
  pct: number;
}

/**
 * TenantLimitService — compares metered usage against the tenant's effective plan limits
 * and reports violations. When any metric exceeds its limit it publishes
 * TenantLimitsExceeded so notifications / enforcement can react (decoupled via the bus).
 */
class TenantLimitService {
  limitsFor(ctx: TenantContext): TenantLimits { return subscriptionService.limitsFor(ctx); }

  evaluate(ctx: TenantContext, usage: TenantUsage): { violations: LimitViolation[]; usage: TenantUsage; limits: TenantLimits } {
    const limits = this.limitsFor(ctx);
    const violations: LimitViolation[] = [];
    for (const [u, l] of Object.entries(USAGE_TO_LIMIT) as [keyof TenantUsage, keyof TenantLimits][]) {
      const used = usage[u]; const limit = limits[l];
      const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
      if (used > limit) violations.push({ metric: u, used, limit, pct });
    }
    if (violations.length) {
      void eventBus.publish('TenantLimitsExceeded', { tenantId: ctx.tenantId, metrics: violations.map((v) => v.metric) }, { source: 'limits', metadata: { target: ctx.tenantId, actor: 'system' } });
    }
    return { violations, usage, limits };
  }

  pct(ctx: TenantContext, usage: TenantUsage, metric: keyof TenantUsage): number {
    const l = USAGE_TO_LIMIT[metric];
    if (!l) return 0;
    const limit = this.limitsFor(ctx)[l];
    return limit > 0 ? Math.min(100, Math.round((usage[metric] / limit) * 100)) : 0;
  }
}

export const tenantLimitService = new TenantLimitService();
