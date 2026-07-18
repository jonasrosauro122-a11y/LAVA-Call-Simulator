import type { AIProvider, AIRequest, AIResponse, AITaskType, ProviderMetadata } from '../types';

// Deterministic mock generation per task. Real providers will replace only the
// body of generate(); the interface and response shape stay identical.
function mockContent(task: AITaskType, input: string): { text: string; confidence: number } {
  const snippet = input.slice(0, 60).replace(/\s+/g, ' ').trim();
  switch (task) {
    case 'conversation':
      return { text: 'I see what you mean. Can you tell me a bit more about how that works?', confidence: 0.82 };
    case 'coaching':
      return { text: 'Strong empathy in your opening. Tighten your close by confirming the next step.', confidence: 0.8 };
    case 'analysis':
      return { text: 'Clear structure; watch pacing and add one concrete solution statement.', confidence: 0.78 };
    case 'scenario':
      return { text: 'A busy small-business owner calls about a billing discrepancy and is short on time.', confidence: 0.85 };
    case 'summary':
      return { text: `Summary: ${snippet}…`, confidence: 0.9 };
    case 'recommendation':
      return { text: 'Practice objection handling next; try the Cold Calling roleplay.', confidence: 0.83 };
    case 'evaluation':
      return { text: 'Meets expectations. Score ~74/100 with room to grow in confidence.', confidence: 0.76 };
    case 'hint':
      return { text: 'Try acknowledging the concern before offering a solution.', confidence: 0.88 };
    case 'followup':
      return { text: 'What matters most to you in choosing a plan?', confidence: 0.86 };
    case 'classification':
      return { text: 'objection', confidence: 0.91 };
    default:
      return { text: 'OK', confidence: 0.7 };
  }
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

export interface MockProviderOptions {
  // Simulate an outage for failover demonstrations.
  forceUnavailable?: boolean;
  // Multiplies latency to differentiate providers deterministically.
  latencyJitter?: number;
}

export function createMockProvider(metadata: ProviderMetadata, opts: MockProviderOptions = {}): AIProvider {
  return {
    metadata,
    supports() {
      return true; // mock providers support every task
    },
    isAvailable() {
      return !opts.forceUnavailable && metadata.availability !== 'offline';
    },
    async generate(req: AIRequest): Promise<AIResponse> {
      const started = Date.now();
      const { text, confidence } = mockContent(req.task, req.input);
      const promptTokens = estimateTokens(req.input);
      const completionTokens = estimateTokens(text);
      const total = promptTokens + completionTokens;
      const latencyMs = Math.round(metadata.latencyEstimateMs * (opts.latencyJitter ?? 1));
      const cost = (total / 1000) * metadata.estimatedCostPer1kTokens;
      return {
        success: true,
        provider: metadata.id,
        model: metadata.model,
        response: text,
        confidence,
        tokens: { prompt: promptTokens, completion: completionTokens, total },
        latencyMs,
        cost: Number(cost.toFixed(6)),
        metadata: { mock: true, task: req.task, elapsed: Date.now() - started },
        errors: [],
        timestamp: new Date().toISOString(),
      };
    },
  };
}

const caps = (over: Partial<ProviderMetadata['capabilities']> = {}) => ({
  streaming: true, vision: false, audio: false, functionCalling: true, structuredOutput: true, maxContextWindow: 128000, ...over,
});

// Concrete mock providers mirroring the providers named in the spec.
export const mockOpenAI = createMockProvider({
  id: 'mock-openai', name: 'OpenAI (mock)', model: 'gpt-4o-mini',
  capabilities: caps({ vision: true, maxContextWindow: 128000 }),
  tokenLimit: 16000, estimatedCostPer1kTokens: 0.0006, latencyEstimateMs: 700, availability: 'available', local: false, qualityScore: 88,
});

export const mockClaude = createMockProvider({
  id: 'mock-claude', name: 'Anthropic Claude (mock)', model: 'claude-sonnet',
  capabilities: caps({ vision: true, maxContextWindow: 200000 }),
  tokenLimit: 8000, estimatedCostPer1kTokens: 0.003, latencyEstimateMs: 900, availability: 'available', local: false, qualityScore: 93,
});

export const mockGeminiFlash = createMockProvider({
  id: 'mock-gemini-flash', name: 'Google Gemini Flash (mock)', model: 'gemini-1.5-flash',
  capabilities: caps({ vision: true, maxContextWindow: 1000000 }),
  tokenLimit: 8000, estimatedCostPer1kTokens: 0.0001, latencyEstimateMs: 300, availability: 'available', local: false, qualityScore: 80,
});

export const mockOllama = createMockProvider({
  id: 'mock-ollama', name: 'Ollama Local (mock)', model: 'llama3.1',
  capabilities: caps({ functionCalling: false, maxContextWindow: 32000 }),
  tokenLimit: 8000, estimatedCostPer1kTokens: 0, latencyEstimateMs: 1200, availability: 'available', local: true, qualityScore: 72,
});
