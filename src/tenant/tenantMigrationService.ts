import type { TenantContext } from './types';

export interface IsolationStep { layer: string; today: string; production: string; }
export interface ReadinessItem { item: string; ready: boolean; note: string; }

/**
 * TenantMigrationService — documents and (later) executes the move from the current
 * in-memory/demo multi-tenancy to full production isolation. It exists so the isolation
 * strategy is a first-class, inspectable artifact rather than tribal knowledge.
 *
 * ISOLATION STRATEGY (how tenant_id is enforced when auth + RLS arrive):
 *  1. Every additive table already carries a `tenant_id` column (Stage 9 migration).
 *  2. A Postgres RLS policy `tenant_id = current_setting('app.tenant_id')::uuid` is added
 *     per table; the app sets that GUC from the authenticated session's tenant claim.
 *  3. TenantResolver switches from localStorage to reading the session/host claim — the
 *     only code change, because every service already receives a TenantContext.
 *  4. TenantStorage's `t:{tenantId}:{key}` prefix maps 1:1 onto the RLS predicate, so the
 *     same access shape is enforced one layer lower with no business-logic change.
 *  5. Writes attach ctx.tenantId; reads filter by it. Services never assume one org.
 */
class TenantMigrationService {
  isolationPlan(): IsolationStep[] {
    return [
      { layer: 'Schema', today: 'additive tenant_id columns, nullable', production: 'backfill + NOT NULL + FK to tenants' },
      { layer: 'Database', today: 'RLS enabled, permissive anon policy', production: "RLS: tenant_id = current_setting('app.tenant_id')" },
      { layer: 'Resolution', today: 'localStorage current tenant', production: 'session/host claim in TenantResolver' },
      { layer: 'Services', today: 'accept + propagate TenantContext', production: 'unchanged — already tenant-aware' },
      { layer: 'Storage', today: 't:{tenantId}:{key} namespacing', production: 'server-side scoped queries' },
      { layer: 'Auth', today: 'demo (no auth)', production: 'SSO/SAML/OAuth via AuthExtensionRegistry' },
    ];
  }

  readiness(): ReadinessItem[] {
    return [
      { item: 'tenant_id on all new tables', ready: true, note: 'Stage 9 migration' },
      { item: 'TenantContext threaded through services', ready: true, note: 'all services accept ctx' },
      { item: 'EventBus tenant events', ready: true, note: '14 events published' },
      { item: 'Row-level security policies', ready: false, note: 'requires backend auth' },
      { item: 'Session-based tenant resolution', ready: false, note: 'requires auth provider' },
    ];
  }

  // Placeholder for moving a tenant's local demo data into scoped/persistent storage.
  async migrateLocalToScoped(_ctx: TenantContext): Promise<{ migrated: boolean; note: string }> {
    return { migrated: false, note: 'No-op until backend persistence is enabled.' };
  }
}

export const tenantMigrationService = new TenantMigrationService();
