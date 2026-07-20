import { eventBus } from '../platform/eventBus';
import { createRng } from '../learning/scenarioEngine/rng';
import type { TenantContext, TenantUsage, UsageMetric } from './types';

const ZERO: TenantUsage = {
  users: 0, voiceMinutes: 0, aiTokens: 0, storageMb: 0, reports: 0, exports: 0,
  certificates: 0, simulations: 0, apiCalls: 0, learningHours: 0,
};

/**
 * TenantUsageService — per-tenant metering (Feature 8), the substrate for future
 * billing. Usage is stored per tenant id (fully isolated); every change publishes
 * TenantUsageUpdated. Demo values are seeded deterministically so dashboards populate.
 */
class TenantUsageService {
  private usage = new Map<string, TenantUsage>();

  get(ctx: TenantContext): TenantUsage {
    if (!this.usage.has(ctx.tenantId)) this.usage.set(ctx.tenantId, this.seedFor(ctx.tenantId));
    return { ...this.usage.get(ctx.tenantId)! };
  }

  private seedFor(tenantId: string): TenantUsage {
    if (tenantId === 'default') return { ...ZERO, users: 1 };
    const rng = createRng(tenantId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
    return {
      users: rng.int(3, 480), voiceMinutes: rng.int(50, 12000), aiTokens: rng.int(50000, 20000000),
      storageMb: rng.int(100, 80000), reports: rng.int(0, 200), exports: rng.int(0, 120),
      certificates: rng.int(0, 900), simulations: rng.int(20, 80000), apiCalls: rng.int(500, 800000),
      learningHours: rng.int(10, 6000),
    };
  }

  increment(ctx: TenantContext, metric: UsageMetric, by = 1): TenantUsage {
    const current = this.get(ctx);
    current[metric] += by;
    this.usage.set(ctx.tenantId, current);
    void eventBus.publish('TenantUsageUpdated', { tenantId: ctx.tenantId, metric, value: current[metric] }, { source: 'usage', metadata: { target: ctx.tenantId } });
    return { ...current };
  }

  reset(ctx: TenantContext): void { this.usage.set(ctx.tenantId, { ...ZERO }); }
}

export const tenantUsageService = new TenantUsageService();
