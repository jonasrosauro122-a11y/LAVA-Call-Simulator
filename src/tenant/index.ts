// Multi-Tenant SaaS layer — public surface. Services are singletons and tenant-aware;
// every function that touches tenant data takes a TenantContext.
export * from './types';
export { PLANS, DEFAULT_BRANDING, DEFAULT_AI_CONFIG, DEFAULT_VOICE_CONFIG } from './defaults';
export { tenantEngine } from './tenantEngine';
export { tenantResolver, tenantStorage } from './tenantResolver';
export { subscriptionService } from './subscriptionService';
export { tenantUsageService } from './tenantUsageService';
export { tenantLimitService, type LimitViolation } from './tenantLimitService';
export { tenantBrandingService } from './tenantBrandingService';
export { tenantConfigurationService } from './tenantConfigurationService';
export { tenantDomainService } from './tenantDomainService';
export { tenantProvisioner, type ProvisionStep } from './tenantProvisioner';
export { tenantMigrationService, type IsolationStep, type ReadinessItem } from './tenantMigrationService';
export { authExtensions, type AuthProvider, type AuthProviderDefinition } from './authProviders';
