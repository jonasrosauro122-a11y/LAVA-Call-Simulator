import { eventBus } from '../platform/eventBus';

// Observability (Phase 7). A lightweight in-memory metrics collector: counters, gauges,
// and timing samples, plus provider status. Subscribes to the EventBus so system activity
// is measured without instrumenting each producer. Server deployments forward these to a
// real backend (Prometheus/Datadog) via the same snapshot shape.

export type ProviderState = 'operational' | 'degraded' | 'down' | 'not_configured';

export interface MetricsSnapshot {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  timings: Record<string, { count: number; avgMs: number; p95Ms: number }>;
  providers: Record<string, ProviderState>;
  errors: { at: string; scope: string; message: string }[];
  uptimeMs: number;
}

class MetricsService {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private samples = new Map<string, number[]>();
  private providers = new Map<string, ProviderState>();
  private errors: { at: string; scope: string; message: string }[] = [];
  private started = Date.now();
  private bound = false;

  increment(name: string, by = 1): void { this.counters.set(name, (this.counters.get(name) ?? 0) + by); }
  gauge(name: string, value: number): void { this.gauges.set(name, value); }
  timing(name: string, ms: number): void {
    const arr = this.samples.get(name) ?? []; arr.push(ms);
    if (arr.length > 200) arr.shift();
    this.samples.set(name, arr);
  }
  setProvider(name: string, state: ProviderState): void { this.providers.set(name, state); }
  recordError(scope: string, message: string): void {
    this.errors.unshift({ at: new Date().toISOString(), scope, message });
    if (this.errors.length > 100) this.errors.pop();
    this.increment('errors.total');
  }

  async time<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const t0 = Date.now();
    try { return await fn(); } finally { this.timing(name, Date.now() - t0); }
  }

  bindToEventBus(): void {
    if (this.bound) return;
    this.bound = true;
    eventBus.subscribeAny((e) => {
      this.increment('events.total');
      this.increment(`events.${e.type}`);
      if (e.type === 'JobFailed') this.recordError('jobQueue', String((e.payload as { error?: string })?.error ?? 'job failed'));
    }, { priority: -200 });
  }

  snapshot(): MetricsSnapshot {
    const timings: MetricsSnapshot['timings'] = {};
    for (const [k, arr] of this.samples) {
      if (!arr.length) continue;
      const sorted = [...arr].sort((a, b) => a - b);
      timings[k] = {
        count: arr.length,
        avgMs: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
        p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1],
      };
    }
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      timings,
      providers: Object.fromEntries(this.providers),
      errors: [...this.errors].slice(0, 20),
      uptimeMs: Date.now() - this.started,
    };
  }
}

export const metrics = new MetricsService();
