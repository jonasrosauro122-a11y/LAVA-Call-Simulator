// Production configuration — environment detection + per-environment settings. Reads
// Vite env vars where present and falls back to safe defaults, so the app boots in any
// environment without secrets. Consumed by security, billing, AI/voice adapters, and the
// launch checklist to report what is configured vs. running in fallback mode.

export type Environment = 'development' | 'staging' | 'production' | 'preview' | 'local';

export interface EnvSettings {
  env: Environment;
  apiTimeoutMs: number;
  rateLimitPerMin: number;
  enableAnalytics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  requireAuth: boolean;
}

type ViteEnv = Record<string, string | boolean | undefined>;
function readEnv(): ViteEnv {
  try { return (import.meta as unknown as { env?: ViteEnv }).env ?? {}; } catch { return {}; }
}

function detect(env: ViteEnv): Environment {
  const explicit = (env.VITE_ENVIRONMENT as string | undefined)?.toLowerCase();
  if (explicit && ['development', 'staging', 'production', 'preview', 'local'].includes(explicit)) return explicit as Environment;
  if (env.PROD === true) return 'production';
  if (env.DEV === true) return 'development';
  return 'local';
}

const PROFILES: Record<Environment, EnvSettings> = {
  local: { env: 'local', apiTimeoutMs: 30000, rateLimitPerMin: 1000, enableAnalytics: false, logLevel: 'debug', requireAuth: false },
  development: { env: 'development', apiTimeoutMs: 30000, rateLimitPerMin: 500, enableAnalytics: false, logLevel: 'debug', requireAuth: false },
  preview: { env: 'preview', apiTimeoutMs: 20000, rateLimitPerMin: 200, enableAnalytics: true, logLevel: 'info', requireAuth: false },
  staging: { env: 'staging', apiTimeoutMs: 20000, rateLimitPerMin: 120, enableAnalytics: true, logLevel: 'info', requireAuth: true },
  production: { env: 'production', apiTimeoutMs: 15000, rateLimitPerMin: 60, enableAnalytics: true, logLevel: 'warn', requireAuth: true },
};

class EnvironmentService {
  private env: ViteEnv;
  readonly settings: EnvSettings;

  constructor() {
    this.env = readEnv();
    this.settings = PROFILES[detect(this.env)];
  }

  current(): Environment { return this.settings.env; }
  isProduction(): boolean { return this.settings.env === 'production'; }

  // Read a named secret/config value; returns undefined when unset (never throws).
  get(key: string): string | undefined {
    const v = this.env[`VITE_${key}`];
    return typeof v === 'string' && v.length ? v : undefined;
  }
  has(key: string): boolean { return this.get(key) !== undefined; }
}

export const environment = new EnvironmentService();
