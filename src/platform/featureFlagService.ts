import { eventBus } from './eventBus';

export type FlagScope = 'global' | 'company' | 'role' | 'user' | 'environment';

export interface FlagRule {
  scope: FlagScope;
  match?: string; // e.g. company id, role id, user id, env name; omitted for global
  enabled: boolean;
}

export interface FeatureFlag {
  id: string;
  label: string;
  description?: string;
  default: boolean;
  rules: FlagRule[];
}

export interface FlagContext {
  company?: string;
  role?: string;
  user?: string;
  environment?: string;
}

// Most specific scope wins.
const PRECEDENCE: FlagScope[] = ['user', 'company', 'role', 'environment', 'global'];

/**
 * FeatureFlagService — global / company / role / user / environment flags with
 * deterministic precedence resolution. New flags register themselves; toggling a
 * flag emits FeatureFlagChanged on the bus for audit + reactive UI.
 */
class FeatureFlagService {
  private flags = new Map<string, FeatureFlag>();

  register(flag: FeatureFlag): void {
    if (!this.flags.has(flag.id)) this.flags.set(flag.id, flag);
  }

  set(id: string, enabled: boolean, scope: FlagScope = 'global', match?: string): void {
    const flag = this.flags.get(id);
    if (!flag) return;
    const existing = flag.rules.find((r) => r.scope === scope && r.match === match);
    if (existing) existing.enabled = enabled;
    else flag.rules.push({ scope, match, enabled });
    void eventBus.publish('FeatureFlagChanged', { id, enabled, scope, match }, { source: 'featureFlags' });
  }

  isEnabled(id: string, ctx: FlagContext = {}): boolean {
    const flag = this.flags.get(id);
    if (!flag) return false;
    for (const scope of PRECEDENCE) {
      const wanted = scope === 'global' ? undefined
        : scope === 'user' ? ctx.user
        : scope === 'company' ? ctx.company
        : scope === 'role' ? ctx.role
        : ctx.environment;
      if (scope !== 'global' && wanted === undefined) continue;
      const rule = flag.rules.find((r) => r.scope === scope && r.match === wanted);
      if (rule) return rule.enabled;
    }
    return flag.default;
  }

  list(): FeatureFlag[] { return [...this.flags.values()]; }
  get(id: string): FeatureFlag | undefined { return this.flags.get(id); }
}

export const featureFlags = new FeatureFlagService();
