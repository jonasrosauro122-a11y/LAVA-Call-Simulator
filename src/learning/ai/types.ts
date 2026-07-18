// AI Provider Abstraction Layer — types.
// Business logic depends ONLY on these interfaces, never on a concrete provider.

export type AITaskType =
  | 'conversation'
  | 'coaching'
  | 'analysis'
  | 'scenario'
  | 'summary'
  | 'recommendation'
  | 'evaluation'
  | 'hint'
  | 'followup'
  | 'classification';

export interface AICapabilities {
  streaming: boolean;
  vision: boolean;
  audio: boolean;
  functionCalling: boolean;
  structuredOutput: boolean;
  maxContextWindow: number;
}

export type Availability = 'available' | 'degraded' | 'offline';

export interface ProviderMetadata {
  id: string;
  name: string;
  model: string;
  capabilities: AICapabilities;
  tokenLimit: number;
  estimatedCostPer1kTokens: number; // USD
  latencyEstimateMs: number;
  availability: Availability;
  local: boolean;
  qualityScore: number; // 0-100, used by the "highest quality" routing strategy
}

export interface AIRequest {
  task: AITaskType;
  input: string;
  context?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  structured?: boolean;
}

export interface AIResponse<T = string> {
  success: boolean;
  provider: string;
  model: string;
  response: T;
  confidence: number;
  tokens: { prompt: number; completion: number; total: number };
  latencyMs: number;
  cost: number;
  metadata: Record<string, unknown>;
  errors: string[];
  timestamp: string;
}

export interface AIProvider {
  readonly metadata: ProviderMetadata;
  supports(task: AITaskType): boolean;
  isAvailable(): boolean;
  generate(req: AIRequest): Promise<AIResponse>;
}

export type RoutingStrategy =
  | 'default'
  | 'cheapest'
  | 'fastest'
  | 'highest_quality'
  | 'lowest_latency'
  | 'round_robin'
  | 'priority'
  | 'fallback_chain';

export interface RoutingRule {
  task: AITaskType;
  providerId: string;
}

export interface AIConfig {
  defaultProvider: string;
  routingStrategy: RoutingStrategy;
  routingRules: RoutingRule[];
  priorityOrder: string[];
  fallbackChain: string[];
  timeoutMs: number;
  retryCount: number;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
}

// Per-tenant overrides (future enterprise multi-tenancy).
export interface TenantAIConfig extends Partial<AIConfig> {
  tenantId: string;
  costLimitUsd?: number;
  qualityPreference?: 'speed' | 'balanced' | 'quality';
  language?: string;
  voiceProvider?: string;
}
