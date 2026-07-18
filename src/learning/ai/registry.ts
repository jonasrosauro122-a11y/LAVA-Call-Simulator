import type { AIProvider } from './types';

// Holds all known providers and their enabled/default state.
export class AIProviderRegistry {
  private providers = new Map<string, AIProvider>();
  private enabled = new Set<string>();
  private defaultId: string | null = null;

  register(provider: AIProvider, opts: { enable?: boolean; makeDefault?: boolean } = {}): void {
    this.providers.set(provider.metadata.id, provider);
    if (opts.enable !== false) this.enabled.add(provider.metadata.id);
    if (opts.makeDefault || this.defaultId === null) this.defaultId = provider.metadata.id;
  }

  unregister(id: string): void {
    this.providers.delete(id);
    this.enabled.delete(id);
    if (this.defaultId === id) this.defaultId = this.all()[0]?.metadata.id ?? null;
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  all(): AIProvider[] {
    return [...this.providers.values()];
  }

  enabledProviders(): AIProvider[] {
    return this.all().filter((p) => this.enabled.has(p.metadata.id));
  }

  isEnabled(id: string): boolean {
    return this.enabled.has(id);
  }

  enable(id: string): void {
    if (this.providers.has(id)) this.enabled.add(id);
  }

  disable(id: string): void {
    this.enabled.delete(id);
  }

  setDefault(id: string): void {
    if (this.providers.has(id)) this.defaultId = id;
  }

  getDefault(): AIProvider | null {
    return this.defaultId ? this.providers.get(this.defaultId) ?? null : null;
  }

  getDefaultId(): string | null {
    return this.defaultId;
  }
}
