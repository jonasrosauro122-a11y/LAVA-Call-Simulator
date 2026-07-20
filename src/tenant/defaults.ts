import type { TenantBranding, TenantAIConfig, TenantVoiceConfig, SubscriptionPlan, PlanTier } from './types';
import { TENANT_FLAG_KEYS } from './types';

export const DEFAULT_BRANDING: TenantBranding = {
  companyName: 'New Organization',
  primaryColor: '#8B0000',
  secondaryColor: '#1a1a1a',
  fontFamily: "'Sora', 'Inter', sans-serif",
  loginScreenHeadline: 'Welcome',
  dashboardBanner: '',
};

export const DEFAULT_AI_CONFIG: TenantAIConfig = {
  provider: 'mock-openai',
  model: 'gpt-4o-mini',
  fallbackProvider: 'mock-claude',
  routingStrategy: 'quality',
  temperature: 0.7,
  maxTokens: 1024,
  streaming: false,
  costLimitUsd: 100,
  promptTemplates: {},
};

export const DEFAULT_VOICE_CONFIG: TenantVoiceConfig = {
  speechProvider: 'mock-whisper',
  realtimeProvider: 'mock-openai-realtime',
  language: 'en',
  accent: 'neutral',
  confidenceThreshold: 0.6,
  customVocabulary: [],
  pronunciationDictionary: {},
  analysisEnabled: true,
};

export function defaultFeatureFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const k of TENANT_FLAG_KEYS) flags[k] = k !== 'marketplace';
  return flags;
}

// Subscription plan catalog (Feature 7). Billing is NOT implemented — limits + feature
// access only. `custom` is an open tier resolved from per-tenant overrides.
export const PLANS: Record<PlanTier, SubscriptionPlan> = {
  free: {
    tier: 'free', name: 'Free', priceHint: '$0',
    limits: { maxUsers: 5, maxTrainers: 1, maxSimulations: 100, storageMb: 500, apiCalls: 1000, voiceMinutes: 60, aiTokens: 100000 },
    features: ['trainer_dashboard', 'certificates'],
  },
  starter: {
    tier: 'starter', name: 'Starter', priceHint: '$49/mo',
    limits: { maxUsers: 25, maxTrainers: 3, maxSimulations: 1000, storageMb: 5000, apiCalls: 20000, voiceMinutes: 600, aiTokens: 1000000 },
    features: ['trainer_dashboard', 'certificates', 'leaderboard', 'scenario_engine'],
  },
  professional: {
    tier: 'professional', name: 'Professional', priceHint: '$199/mo',
    limits: { maxUsers: 100, maxTrainers: 10, maxSimulations: 10000, storageMb: 25000, apiCalls: 100000, voiceMinutes: 3000, aiTokens: 5000000 },
    features: ['trainer_dashboard', 'certificates', 'leaderboard', 'scenario_engine', 'voice_intelligence', 'achievements'],
  },
  business: {
    tier: 'business', name: 'Business', priceHint: '$499/mo',
    limits: { maxUsers: 500, maxTrainers: 40, maxSimulations: 100000, storageMb: 100000, apiCalls: 1000000, voiceMinutes: 15000, aiTokens: 25000000 },
    features: ['trainer_dashboard', 'certificates', 'leaderboard', 'scenario_engine', 'voice_intelligence', 'achievements', 'marketplace'],
  },
  enterprise: {
    tier: 'enterprise', name: 'Enterprise', priceHint: 'Custom',
    limits: { maxUsers: 100000, maxTrainers: 5000, maxSimulations: 100000000, storageMb: 5000000, apiCalls: 1000000000, voiceMinutes: 1000000, aiTokens: 10000000000 },
    features: ['trainer_dashboard', 'certificates', 'leaderboard', 'scenario_engine', 'voice_intelligence', 'achievements', 'marketplace'],
  },
  custom: {
    tier: 'custom', name: 'Custom', priceHint: 'Negotiated',
    limits: { maxUsers: 1000, maxTrainers: 100, maxSimulations: 1000000, storageMb: 500000, apiCalls: 10000000, voiceMinutes: 100000, aiTokens: 100000000 },
    features: ['trainer_dashboard', 'certificates', 'leaderboard', 'scenario_engine', 'voice_intelligence', 'achievements', 'marketplace'],
  },
};
