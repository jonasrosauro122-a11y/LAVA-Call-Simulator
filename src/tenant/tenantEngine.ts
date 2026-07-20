import { uid, nowIso } from '../platform/types';
import { eventBus } from '../platform/eventBus';
import type { Tenant, TenantStatus, PlanTier, TenantContext } from './types';
import { DEFAULT_BRANDING, DEFAULT_AI_CONFIG, DEFAULT_VOICE_CONFIG, defaultFeatureFlags } from './defaults';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface CreateInput {
  name: string;
  plan?: PlanTier;
  status?: TenantStatus;
}

/**
 * TenantEngine — the source of truth for tenant records and their lifecycle.
 * Records live in an in-memory store today; each mutation publishes an EventBus event
 * so other services (usage, limits, branding, audit) react without direct coupling.
 * Swapping the store for Supabase-backed rows is isolated to this file + tenantApi.
 */
class TenantEngine {
  private store = new Map<string, Tenant>();

  constructor() { this.seedDemo(); }

  private build(input: CreateInput): Tenant {
    const now = nowIso();
    const name = input.name;
    return {
      id: uid('tnt'), name, slug: slugify(name),
      status: input.status ?? 'active', plan: input.plan ?? 'starter',
      createdAt: now, updatedAt: now, deleted: false,
      branding: { ...DEFAULT_BRANDING, companyName: name },
      ai: { ...DEFAULT_AI_CONFIG }, voice: { ...DEFAULT_VOICE_CONFIG },
      featureFlags: defaultFeatureFlags(),
      domains: [{ host: `${slugify(name)}.lava.app`, kind: 'subdomain', verified: true }],
    };
  }

  private seedDemo(): void {
    // The implicit single-org context used before auth exists.
    const def = this.build({ name: 'LAVA (Default)', plan: 'enterprise' });
    def.id = 'default'; def.slug = 'default';
    def.branding.companyName = 'LAVA';
    def.domains = [{ host: 'app.lava.app', kind: 'subdomain', verified: true }];
    this.store.set(def.id, def);

    const demos: [string, PlanTier, TenantStatus][] = [
      ['Acme Insurance Academy', 'business', 'active'],
      ['Globex Sales Training', 'professional', 'active'],
      ['Initech Support Desk', 'starter', 'suspended'],
      ['Umbrella Health VA', 'free', 'active'],
    ];
    demos.forEach(([name, plan, status], i) => {
      const t = this.build({ name, plan, status });
      t.id = `tnt-demo-${i + 1}`;
      this.store.set(t.id, t);
    });
  }

  list(includeDeleted = false): Tenant[] {
    return [...this.store.values()].filter((t) => includeDeleted || !t.deleted);
  }
  get(id: string): Tenant | undefined { return this.store.get(id); }

  contextFor(id: string): TenantContext {
    const tenant = this.store.get(id);
    return { tenantId: id, tenant, isDefault: id === 'default' };
  }

  create(input: CreateInput): Tenant {
    const t = this.build(input);
    this.store.set(t.id, t);
    void eventBus.publish('TenantCreated', { tenantId: t.id, name: t.name }, { source: 'tenantEngine', metadata: { actor: 'admin', target: t.id } });
    return t;
  }

  update(id: string, patch: Partial<Tenant>): Tenant | undefined {
    const t = this.store.get(id);
    if (!t) return undefined;
    Object.assign(t, patch, { updatedAt: nowIso() });
    void eventBus.publish('TenantUpdated', { tenantId: id, keys: Object.keys(patch) }, { source: 'tenantEngine', metadata: { target: id } });
    return t;
  }

  private transition(id: string, status: TenantStatus, event: string): Tenant | undefined {
    const t = this.store.get(id);
    if (!t) return undefined;
    t.status = status; t.updatedAt = nowIso();
    if (status === 'deleted') t.deleted = true;
    void eventBus.publish(event, { tenantId: id }, { source: 'tenantEngine', metadata: { target: id } });
    return t;
  }

  suspend(id: string) { return this.transition(id, 'suspended', 'TenantSuspended'); }
  reactivate(id: string) { return this.transition(id, 'active', 'TenantReactivated'); }
  archive(id: string) { return this.transition(id, 'archived', 'TenantArchived'); }
  softDelete(id: string) { return this.transition(id, 'deleted', 'TenantDeleted'); }

  // Clone configuration (branding/ai/voice/flags/plan) into a brand-new tenant.
  clone(id: string, newName: string): Tenant | undefined {
    const src = this.store.get(id);
    if (!src) return undefined;
    const t = this.build({ name: newName, plan: src.plan });
    t.branding = { ...src.branding, companyName: newName };
    t.ai = { ...src.ai }; t.voice = { ...src.voice };
    t.featureFlags = { ...src.featureFlags };
    this.store.set(t.id, t);
    void eventBus.publish('TenantCreated', { tenantId: t.id, clonedFrom: id }, { source: 'tenantEngine', metadata: { actor: 'admin', target: t.id } });
    return t;
  }
}

export const tenantEngine = new TenantEngine();
