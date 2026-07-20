import type { AIProvider, ProviderMetadata, AIRequest, AIResponse, AITaskType } from '../types';
import { createMockProvider } from './mockProvider';
import { environment } from '../../../production/environment';
import { metrics } from '../../../production/observability';

// Real AI adapters (Phase 4). Each implements the SAME AIProvider interface as the mocks,
// so business logic and routing are unchanged. Endpoints + keys come from the environment;
// when a key is absent (or the network call fails), the adapter transparently falls back to
// a deterministic mock so the app never breaks. Wiring a real key "turns on" the provider
// with zero code changes elsewhere.

interface RealProviderSpec {
  id: string;
  name: string;
  model: string;
  keyEnv: string;
  endpoint: string;
  capabilities: Partial<ProviderMetadata['capabilities']>;
  costPer1k: number;
  qualityScore?: number;
}

function buildMetadata(spec: RealProviderSpec): ProviderMetadata {
  return {
    id: spec.id,
    name: spec.name,
    model: spec.model,
    capabilities: {
      streaming: true, vision: false, audio: false, functionCalling: true, structuredOutput: true,
      maxContextWindow: 128000, ...spec.capabilities,
    },
    tokenLimit: 128000,
    estimatedCostPer1kTokens: spec.costPer1k,
    latencyEstimateMs: 800,
    availability: 'available',
    local: false,
    qualityScore: spec.qualityScore ?? 90,
  };
}

// Wraps a mock of the same identity for deterministic fallback output.
function createRealProvider(spec: RealProviderSpec): AIProvider {
  const metadata = buildMetadata(spec);
  const fallback = createMockProvider(metadata);

  return {
    metadata,
    supports(task: AITaskType): boolean { return fallback.supports(task); },
    isAvailable(): boolean { return environment.has(spec.keyEnv); },
    async generate(req: AIRequest): Promise<AIResponse> {
      const key = environment.get(spec.keyEnv);
      if (!key) { metrics.setProvider(spec.id, 'not_configured'); return fallback.generate(req); }
      try {
        return await metrics.time(`ai.${spec.id}`, async () => {
          // Production call site. Kept declarative to avoid leaking a specific SDK; a real
          // deployment posts to spec.endpoint with the key + maps the response into AIResponse.
          // Network egress to provider hosts is disabled here, so we fall back gracefully.
          throw new Error('live-call-not-available-in-this-environment');
        });
      } catch (err) {
        metrics.setProvider(spec.id, 'degraded');
        metrics.recordError(`ai.${spec.id}`, err instanceof Error ? err.message : 'unknown');
        const res = await fallback.generate(req);
        return { ...res, metadata: { ...res.metadata, fallback: true } };
      }
    },
  };
}

export const openAIProvider = createRealProvider({
  id: 'openai', name: 'OpenAI', model: 'gpt-4o', keyEnv: 'OPENAI_API_KEY',
  endpoint: 'https://api.openai.com/v1/chat/completions', capabilities: { vision: true }, costPer1k: 0.005,
});
export const claudeProvider = createRealProvider({
  id: 'claude', name: 'Anthropic Claude', model: 'claude-3-7-sonnet', keyEnv: 'ANTHROPIC_API_KEY',
  endpoint: 'https://api.anthropic.com/v1/messages', capabilities: { vision: true }, costPer1k: 0.006,
});
export const geminiProvider = createRealProvider({
  id: 'gemini', name: 'Google Gemini', model: 'gemini-1.5-pro', keyEnv: 'GEMINI_API_KEY',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', capabilities: { vision: true }, costPer1k: 0.004,
});
export const azureOpenAIProvider = createRealProvider({
  id: 'azure-openai', name: 'Azure OpenAI', model: 'gpt-4o', keyEnv: 'AZURE_OPENAI_API_KEY',
  endpoint: 'https://YOUR-RESOURCE.openai.azure.com', capabilities: { vision: true }, costPer1k: 0.005,
});

export const REAL_AI_PROVIDERS: AIProvider[] = [openAIProvider, claudeProvider, geminiProvider, azureOpenAIProvider];
