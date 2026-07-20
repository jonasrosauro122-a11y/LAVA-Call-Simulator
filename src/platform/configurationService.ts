import { eventBus } from './eventBus';

export interface RetryPolicy {
  retries: number;
  backoffMs: number;
}

export interface PlatformConfig {
  aiProvider: string;
  voiceProvider: string;
  theme: 'system' | 'light' | 'dark';
  language: string;
  timezone: string;
  region: string;
  apiEndpoints: Record<string, string>;
  retryPolicy: RetryPolicy;
  timeoutMs: number;
  rateLimitPerMin: number;
  featureFlagsEnabled: boolean;
}

export const DEFAULT_CONFIG: PlatformConfig = {
  aiProvider: 'mock-openai',
  voiceProvider: 'mock-whisper',
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  region: 'US',
  apiEndpoints: { supabase: '', ai: '', voice: '' },
  retryPolicy: { retries: 3, backoffMs: 250 },
  timeoutMs: 15000,
  rateLimitPerMin: 60,
  featureFlagsEnabled: true,
};

const KEY = 'lava_platform_config';
type Listener = (cfg: PlatformConfig) => void;

/**
 * ConfigurationService — one place for provider selection, locale/region, retry
 * policies, timeouts, rate limits, and endpoints. Persists to localStorage,
 * notifies subscribers, and emits ConfigChanged for audit.
 */
class ConfigurationService {
  private cfg: PlatformConfig;
  private listeners = new Set<Listener>();

  constructor() {
    let loaded = DEFAULT_CONFIG;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) loaded = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch { /* defaults */ }
    this.cfg = loaded;
  }

  getAll(): PlatformConfig { return { ...this.cfg }; }
  get<K extends keyof PlatformConfig>(key: K): PlatformConfig[K] { return this.cfg[key]; }

  set(patch: Partial<PlatformConfig>): void {
    this.cfg = { ...this.cfg, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(this.cfg)); } catch { /* ignore */ }
    this.listeners.forEach((l) => l(this.getAll()));
    void eventBus.publish('ConfigChanged', { keys: Object.keys(patch) }, { source: 'config' });
  }

  reset(): void { this.set({ ...DEFAULT_CONFIG }); }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}

export const config = new ConfigurationService();
