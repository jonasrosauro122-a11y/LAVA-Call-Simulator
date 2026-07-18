import type { AIProvider, AIConfig, AITaskType, RoutingStrategy } from './types';
import type { AIProviderRegistry } from './registry';

function byStrategy(strategy: RoutingStrategy, providers: AIProvider[], config: AIConfig, rr: number): AIProvider | null {
  if (!providers.length) return null;
  const avail = providers.filter((p) => p.isAvailable());
  const pool = avail.length ? avail : providers;
  switch (strategy) {
    case 'cheapest':
      return [...pool].sort((a, b) => a.metadata.estimatedCostPer1kTokens - b.metadata.estimatedCostPer1kTokens)[0];
    case 'fastest':
    case 'lowest_latency':
      return [...pool].sort((a, b) => a.metadata.latencyEstimateMs - b.metadata.latencyEstimateMs)[0];
    case 'highest_quality':
      return [...pool].sort((a, b) => b.metadata.qualityScore - a.metadata.qualityScore)[0];
    case 'round_robin':
      return pool[rr % pool.length];
    case 'priority': {
      for (const id of config.priorityOrder) {
        const found = pool.find((p) => p.metadata.id === id);
        if (found) return found;
      }
      return pool[0];
    }
    case 'fallback_chain':
    case 'default':
    default:
      return pool[0];
  }
}

// Decides which provider(s) handle a task, and in what order for failover.
export class AIRouter {
  private rr = 0;
  constructor(private registry: AIProviderRegistry, private getConfig: () => AIConfig) {}

  // Ordered list: primary first, then the configured fallback chain (deduped).
  selectOrdered(task: AITaskType): AIProvider[] {
    const config = this.getConfig();
    const enabled = this.registry.enabledProviders().filter((p) => p.supports(task));
    if (!enabled.length) return [];

    // Explicit per-task rule wins if the provider is enabled and supports the task.
    const rule = config.routingRules.find((r) => r.task === task);
    let primary: AIProvider | null = rule ? enabled.find((p) => p.metadata.id === rule.providerId) ?? null : null;
    if (!primary) primary = byStrategy(config.routingStrategy, enabled, config, this.rr++);

    const ordered: AIProvider[] = [];
    const push = (p?: AIProvider | null) => { if (p && !ordered.some((o) => o.metadata.id === p.metadata.id)) ordered.push(p); };

    push(primary);
    for (const id of config.fallbackChain) push(enabled.find((p) => p.metadata.id === id));
    for (const p of enabled) push(p); // ensure everything is a candidate last
    return ordered;
  }

  select(task: AITaskType): AIProvider | null {
    return this.selectOrdered(task)[0] ?? null;
  }
}
