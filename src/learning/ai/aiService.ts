import type { AIRequest, AIResponse, AIConfig } from './types';
import type { AIRouter } from './router';

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('AI request timed out')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

function failure(req: AIRequest, errors: string[]): AIResponse {
  return {
    success: false, provider: 'none', model: 'none', response: '',
    confidence: 0, tokens: { prompt: 0, completion: 0, total: 0 },
    latencyMs: 0, cost: 0, metadata: { task: req.task }, errors,
    timestamp: new Date().toISOString(),
  };
}

// Single entry point for all AI work. Handles routing, retry, and failover, and
// always returns a consistent AIResponse — callers never see provider errors.
export class AIService {
  constructor(private router: AIRouter, private getConfig: () => AIConfig) {}

  async generate(req: AIRequest): Promise<AIResponse> {
    const config = this.getConfig();
    const providers = this.router.selectOrdered(req.task);
    if (!providers.length) return failure(req, ['No enabled provider supports this task']);

    const errors: string[] = [];
    for (const provider of providers) {
      for (let attempt = 0; attempt <= config.retryCount; attempt++) {
        try {
          const res = await timeout(provider.generate(req), config.timeoutMs);
          if (res.success) return res;
          errors.push(`${provider.metadata.id}: unsuccessful response`);
        } catch (e) {
          errors.push(`${provider.metadata.id}: ${(e as Error).message}`);
        }
      }
    }
    return failure(req, errors);
  }
}
