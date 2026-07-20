import { eventBus } from '../platform/eventBus';
import { tenantEngine } from './tenantEngine';
import { subscriptionService } from './subscriptionService';
import type { TenantContext, TenantAIConfig, TenantVoiceConfig } from './types';
import { DEFAULT_AI_CONFIG, DEFAULT_VOICE_CONFIG } from './defaults';

/**
 * TenantConfigurationService — per-tenant AI config (Feature 4), voice config (Feature 5),
 * and feature flags (Feature 6). Each write publishes the matching event. Feature
 * resolution combines the tenant's own flag with plan entitlement, so a flag can never
 * exceed what the subscription allows.
 */
class TenantConfigurationService {
  getAI(ctx: TenantContext): TenantAIConfig { return ctx.tenant?.ai ?? { ...DEFAULT_AI_CONFIG }; }
  setAI(ctx: TenantContext, patch: Partial<TenantAIConfig>): void {
    const t = tenantEngine.get(ctx.tenantId); if (!t) return;
    tenantEngine.update(ctx.tenantId, { ai: { ...t.ai, ...patch } });
    void eventBus.publish('AIProviderChanged', { tenantId: ctx.tenantId, keys: Object.keys(patch) }, { source: 'tenantConfig', metadata: { target: ctx.tenantId } });
  }

  getVoice(ctx: TenantContext): TenantVoiceConfig { return ctx.tenant?.voice ?? { ...DEFAULT_VOICE_CONFIG }; }
  setVoice(ctx: TenantContext, patch: Partial<TenantVoiceConfig>): void {
    const t = tenantEngine.get(ctx.tenantId); if (!t) return;
    tenantEngine.update(ctx.tenantId, { voice: { ...t.voice, ...patch } });
    void eventBus.publish('VoiceProviderChanged', { tenantId: ctx.tenantId, keys: Object.keys(patch) }, { source: 'tenantConfig', metadata: { target: ctx.tenantId } });
  }

  getFlags(ctx: TenantContext): Record<string, boolean> { return { ...(ctx.tenant?.featureFlags ?? {}) }; }
  setFlag(ctx: TenantContext, key: string, enabled: boolean): void {
    const t = tenantEngine.get(ctx.tenantId); if (!t) return;
    tenantEngine.update(ctx.tenantId, { featureFlags: { ...t.featureFlags, [key]: enabled } });
    void eventBus.publish('FeatureFlagsChanged', { tenantId: ctx.tenantId, key, enabled }, { source: 'tenantConfig', metadata: { target: ctx.tenantId } });
  }

  // Effective feature = tenant flag ON *and* the plan includes it.
  isFeatureEnabled(ctx: TenantContext, key: string): boolean {
    const flag = ctx.tenant?.featureFlags?.[key] ?? false;
    return flag && subscriptionService.featureAllowed(ctx, key);
  }
}

export const tenantConfigurationService = new TenantConfigurationService();
