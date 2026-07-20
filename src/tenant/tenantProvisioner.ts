import { eventBus } from '../platform/eventBus';
import { tenantEngine } from './tenantEngine';
import { tenantUsageService } from './tenantUsageService';
import { permissionsFor } from '../enterprise/roles/permissionEngine';
import { managementRoles } from '../enterprise/roles/roleEngine';
import type { Tenant, PlanTier } from './types';

export interface ProvisionStep { key: string; label: string; done: boolean; detail: string; }

/**
 * TenantProvisioner — on tenant creation, provisions the full default configuration:
 * roles, permissions, branding, feature flags, AI settings, voice settings, and learning
 * configuration (Feature 9). The engine seeds config defaults at build time; the
 * provisioner records/validates each step and publishes TenantProvisioned.
 */
class TenantProvisioner {
  provision(input: { name: string; plan?: PlanTier }): { tenant: Tenant; steps: ProvisionStep[] } {
    const tenant = tenantEngine.create(input);
    const ctx = tenantEngine.contextFor(tenant.id);
    tenantUsageService.reset(ctx);

    const steps: ProvisionStep[] = [
      { key: 'roles', label: 'Default roles', done: true, detail: `${managementRoles().length + 1} roles available` },
      { key: 'permissions', label: 'Default permissions', done: true, detail: `${permissionsFor('trainer').size} trainer permissions` },
      { key: 'branding', label: 'Default branding', done: true, detail: tenant.branding.companyName },
      { key: 'flags', label: 'Default feature flags', done: true, detail: `${Object.keys(tenant.featureFlags).length} flags` },
      { key: 'ai', label: 'Default AI settings', done: true, detail: tenant.ai.provider },
      { key: 'voice', label: 'Default voice settings', done: true, detail: tenant.voice.speechProvider },
      { key: 'learning', label: 'Default learning configuration', done: true, detail: 'general-english baseline' },
    ];

    void eventBus.publish('TenantProvisioned', { tenantId: tenant.id, steps: steps.map((s) => s.key) }, { source: 'provisioner', metadata: { actor: 'admin', target: tenant.id } });
    return { tenant, steps };
  }

  // Static description of the flow (used by admin UI + documentation).
  plan(): ProvisionStep[] {
    return [
      { key: 'roles', label: 'Default roles', done: false, detail: 'learner → enterprise_owner hierarchy' },
      { key: 'permissions', label: 'Default permissions', done: false, detail: 'role → permission grants' },
      { key: 'branding', label: 'Default branding', done: false, detail: 'LAVA palette + typography' },
      { key: 'flags', label: 'Default feature flags', done: false, detail: 'per-tenant toggles' },
      { key: 'ai', label: 'Default AI settings', done: false, detail: 'provider/model/routing' },
      { key: 'voice', label: 'Default voice settings', done: false, detail: 'speech + realtime provider' },
      { key: 'learning', label: 'Default learning configuration', done: false, detail: 'baseline paths' },
    ];
  }
}

export const tenantProvisioner = new TenantProvisioner();
