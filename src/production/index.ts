// Production layer — release-candidate cross-cutting concerns. All additive; existing
// engines, providers, contexts, and the design system are reused unchanged.
export { environment, type Environment } from './environment';
export * from './security';
export { metrics, type MetricsSnapshot, type ProviderState } from './observability';
export { billingService, type BillingProvider, type BillingProviderId } from './billing';
export { authService, type Session, type AuthResult } from './auth';
export { checklistEngine, KNOWN_ROUTES, type ChecklistResult, type CheckItem } from './checklistEngine';
export { t, setLocale, getLocale, registerMessages } from './i18n';
export { TTLCache, memoize, retry } from './performance';
export { ProductionProvider, useProduction } from './context/ProductionProvider';
export { ErrorBoundary } from './components/ErrorBoundary';
export { LoadingState, ErrorState, EmptyState, OfflineBanner } from './components/StateViews';
