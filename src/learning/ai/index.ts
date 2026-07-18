import { AIProviderRegistry } from './registry';
import { AIRouter } from './router';
import { AIService } from './aiService';
import { getAIConfig } from './config';
import { mockOpenAI, mockClaude, mockGeminiFlash, mockOllama } from './providers/mockProvider';

// Composition root: register providers, wire the router + service.
// Adding a real provider later = implement AIProvider + registry.register(...).
export const aiRegistry = new AIProviderRegistry();
aiRegistry.register(mockClaude, { makeDefault: false });
aiRegistry.register(mockOpenAI, { makeDefault: true });
aiRegistry.register(mockGeminiFlash);
aiRegistry.register(mockOllama);

export const aiRouter = new AIRouter(aiRegistry, getAIConfig);
export const aiService = new AIService(aiRouter, getAIConfig);

export * from './types';
export { getAIConfig, setAIConfig, DEFAULT_AI_CONFIG } from './config';
