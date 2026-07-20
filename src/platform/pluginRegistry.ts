import { eventBus } from './eventBus';
import { featureFlags } from './featureFlagService';
import { config } from './configurationService';

export type PluginKind =
  | 'ai_provider' | 'voice_provider' | 'scenario_pack' | 'learning_module'
  | 'analytics_extension' | 'notification_provider' | 'export_provider' | 'marketplace';

// A minimal capability surface passed to a plugin at registration time. Plugins use
// this instead of importing app internals — so they register without touching app code.
export interface PluginContext {
  eventBus: typeof eventBus;
  flags: typeof featureFlags;
  config: typeof config;
  log: (msg: string) => void;
}

export interface PluginManifest {
  id: string;
  kind: PluginKind;
  name: string;
  version: string;
  description?: string;
  register?: (ctx: PluginContext) => void;
}

export interface RegisteredPlugin extends PluginManifest {
  registeredAt: string;
}

/**
 * PluginRegistry — future AI providers, voice providers, scenario packs, learning
 * modules, analytics/notification/export extensions, and marketplace add-ons register
 * themselves here by calling register(manifest). The registry invokes the manifest's
 * own register(ctx) hook, so no application code is edited to add a plugin.
 */
class PluginRegistry {
  private plugins = new Map<string, RegisteredPlugin>();

  register(manifest: PluginManifest): void {
    if (this.plugins.has(manifest.id)) return;
    const ctx: PluginContext = {
      eventBus, flags: featureFlags, config,
      log: (msg) => console.info(`[plugin:${manifest.id}]`, msg),
    };
    try { manifest.register?.(ctx); } catch (err) { console.warn('[PluginRegistry] register failed', manifest.id, err); }
    this.plugins.set(manifest.id, { ...manifest, registeredAt: new Date().toISOString() });
    void eventBus.publish('PluginRegistered', { id: manifest.id, kind: manifest.kind }, { source: 'plugins' });
  }

  unregister(id: string): void { this.plugins.delete(id); }
  get(id: string): RegisteredPlugin | undefined { return this.plugins.get(id); }
  list(kind?: PluginKind): RegisteredPlugin[] {
    const all = [...this.plugins.values()];
    return kind ? all.filter((p) => p.kind === kind) : all;
  }
}

export const plugins = new PluginRegistry();
