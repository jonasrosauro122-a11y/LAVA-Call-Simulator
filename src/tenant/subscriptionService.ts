import { eventBus } from '../platform/eventBus';
import { tenantEngine } from './tenantEngine';
import { PLANS } from './defaults';
import type { PlanTier, SubscriptionPlan, TenantContext, TenantLimits } from './types';

/**
 * SubscriptionService — plan catalog + plan changes. No billing; it resolves the limits
 * and feature access a tenant is entitled to. Plan changes publish SubscriptionChanged.
 */
class SubscriptionService {
  plans(): SubscriptionPlan[] { return Object.values(PLANS); }
  getPlan(tier: PlanTier): SubscriptionPlan { return PLANS[tier]; }

  planFor(ctx: TenantContext): SubscriptionPlan {
    return PLANS[ctx.tenant?.plan ?? 'free'];
  }

  // Effective limits = plan limits with any per-tenant override applied.
  limitsFor(ctx: TenantContext): TenantLimits {
    const base = this.planFor(ctx).limits;
    return { ...base, ...(ctx.tenant?.limitsOverride ?? {}) };
  }

  featureAllowed(ctx: TenantContext, feature: string): boolean {
    return this.planFor(ctx).features.includes(feature);
  }

  changePlan(ctx: TenantContext, tier: PlanTier): void {
    tenantEngine.update(ctx.tenantId, { plan: tier });
    void eventBus.publish('SubscriptionChanged', { tenantId: ctx.tenantId, tier }, { source: 'subscription', metadata: { target: ctx.tenantId } });
  }
}

export const subscriptionService = new SubscriptionService();
