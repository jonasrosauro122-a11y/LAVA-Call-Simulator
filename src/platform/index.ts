// Platform Core Infrastructure — public surface. All services are singletons and can
// be imported directly by any layer; the React context (PlatformProvider) only adds
// reactivity for the admin console.
export * from './types';
export { eventBus, type EventEnvelope, type EventHandler, type EventTransport, type PublishOptions } from './eventBus';
export { auditService, type AuditEntry } from './auditService';
export { featureFlags, type FeatureFlag, type FlagScope, type FlagContext } from './featureFlagService';
export { config, DEFAULT_CONFIG, type PlatformConfig, type RetryPolicy } from './configurationService';
export { plugins, type PluginManifest, type PluginKind, type RegisteredPlugin, type PluginContext } from './pluginRegistry';
export { jobQueue, type Job, type JobStatus, type JobRunner } from './jobQueue';
export { scheduler, computeNextRun, cronMatches, type ScheduledTask } from './scheduler';
export { webhooks, type Webhook, type WebhookDelivery, type WebhookTransport } from './webhookService';
export { integrations, type IntegrationDefinition, type IntegrationConnector, type IntegrationCategory } from './integrationService';
export { branding, DEFAULT_BRANDING, type BrandingTheme } from './brandingService';
export { initPlatform } from './bootstrap';
