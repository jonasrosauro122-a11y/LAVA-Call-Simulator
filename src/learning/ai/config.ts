import type { AIConfig } from './types';

// Configuration lives separately from business logic and is changeable at runtime
// (and, in future, per tenant) without touching application code.
export const DEFAULT_AI_CONFIG: AIConfig = {
  defaultProvider: 'mock-openai',
  routingStrategy: 'fallback_chain',
  routingRules: [
    { task: 'conversation', providerId: 'mock-openai' },
    { task: 'scenario', providerId: 'mock-claude' },
    { task: 'analysis', providerId: 'mock-claude' },
    { task: 'coaching', providerId: 'mock-claude' },
    { task: 'classification', providerId: 'mock-gemini-flash' },
    { task: 'hint', providerId: 'mock-gemini-flash' },
  ],
  priorityOrder: ['mock-claude', 'mock-openai', 'mock-gemini-flash', 'mock-ollama'],
  fallbackChain: ['mock-openai', 'mock-gemini-flash', 'mock-ollama'],
  timeoutMs: 8000,
  retryCount: 1,
  temperature: 0.7,
  maxTokens: 1024,
  streamingEnabled: false,
};

const KEY = 'lava_ai_config';
let current: AIConfig = { ...DEFAULT_AI_CONFIG };

try {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(KEY);
    if (raw) current = { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
  }
} catch { /* ignore */ }

export function getAIConfig(): AIConfig {
  return current;
}

export function setAIConfig(patch: Partial<AIConfig>): AIConfig {
  current = { ...current, ...patch };
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(current));
  } catch { /* ignore */ }
  return current;
}
