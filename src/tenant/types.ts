// Multi-Tenant SaaS layer. Every service accepts and propagates a TenantContext, so
// no business logic assumes a single organization. The current implementation uses an
// in-memory demo store (no auth yet); moving to production RLS is configuration, not a
// rewrite (see tenantMigrationService + the isolation notes in each service).

export type TenantStatus = 'active' | 'suspended' | 'archived' | 'deleted';

export type PlanTier = 'free' | 'starter' | 'professional' | 'business' | 'enterprise' | 'custom';

export interface TenantLimits {
  maxUsers: number;
  maxTrainers: number;
  maxSimulations: number;
  storageMb: number;
  apiCalls: number;
  voiceMinutes: number;
  aiTokens: number;
}

export interface TenantUsage {
  users: number;
  voiceMinutes: number;
  aiTokens: number;
  storageMb: number;
  reports: number;
  exports: number;
  certificates: number;
  simulations: number;
  apiCalls: number;
  learningHours: number;
}

export type UsageMetric = keyof TenantUsage;

export interface SubscriptionPlan {
  tier: PlanTier;
  name: string;
  priceHint: string; // display only; billing not implemented
  limits: TenantLimits;
  features: string[];
}

export interface TenantBranding {
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  loginScreenHeadline?: string;
  dashboardBanner?: string;
  certificateBranding?: string;
  emailBranding?: string;
}

export interface TenantAIConfig {
  provider: string;
  model: string;
  fallbackProvider: string;
  routingStrategy: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  costLimitUsd: number;
  promptTemplates: Record<string, string>;
}

export interface TenantVoiceConfig {
  speechProvider: string;
  realtimeProvider: string;
  language: string;
  accent: string;
  confidenceThreshold: number;
  customVocabulary: string[];
  pronunciationDictionary: Record<string, string>;
  analysisEnabled: boolean;
}

export type DomainKind = 'subdomain' | 'custom';
export interface TenantDomain {
  host: string; // e.g. acme.lava.app or learn.acme.com
  kind: DomainKind;
  verified: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: PlanTier;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  branding: TenantBranding;
  ai: TenantAIConfig;
  voice: TenantVoiceConfig;
  featureFlags: Record<string, boolean>;
  domains: TenantDomain[];
  limitsOverride?: Partial<TenantLimits>;
}

// Threaded through every tenant-aware call. `isDefault` marks the implicit
// single-org context used before authentication exists.
export interface TenantContext {
  tenantId: string;
  tenant?: Tenant;
  isDefault: boolean;
}

// Authentication extension points (Feature 12) — interfaces only, no implementation.
export type AuthProviderKind = 'google' | 'microsoft' | 'okta' | 'azure_ad' | 'saml' | 'magic_link' | 'oauth';

export const TENANT_FLAG_KEYS = [
  'voice_intelligence', 'trainer_dashboard', 'scenario_engine', 'certificates',
  'achievements', 'leaderboard', 'marketplace',
] as const;

// Tenant lifecycle + config events published on the platform EventBus.
export const TENANT_EVENTS = [
  'TenantCreated', 'TenantUpdated', 'TenantProvisioned', 'TenantSuspended',
  'TenantReactivated', 'TenantArchived', 'TenantDeleted', 'TenantUsageUpdated',
  'SubscriptionChanged', 'BrandingUpdated', 'TenantLimitsExceeded',
  'AIProviderChanged', 'VoiceProviderChanged', 'FeatureFlagsChanged',
] as const;
