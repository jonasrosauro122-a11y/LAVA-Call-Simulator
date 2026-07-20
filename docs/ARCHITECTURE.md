# LAVA — Architecture Summary

LAVA is a multi-tenant AI communication-skills SaaS built in additive layers. Each layer
depends only on those below it and communicates cross-cutting events through the platform
EventBus.

## Layers (bottom → top)
1. **Design system** — `src/components/ui` (Button, Card, ProgressRing, ScoreBadge, Logo) + Tailwind tokens (lava/ink palettes, Sora/Inter/JetBrains).
2. **Core app** — anonymous candidate assessment: `AssessmentContext`, 7 modules, Dashboard, Simulator, Report.
3. **Learning layer** (`src/learning`) — Learning engine, Gamification, AI Analysis, Scenario engine + AI provider layer, Voice Intelligence engine.
4. **Enterprise layer** (`src/enterprise`) — RBAC (7 roles / 14 permissions), roster, cohorts, assignments, reporting, notifications, trainer & company dashboards.
5. **Platform layer** (`src/platform`) — 10 infrastructure singletons: EventBus, Audit, FeatureFlags, Configuration, PluginRegistry, JobQueue, Scheduler, Webhooks, Integrations, Branding.
6. **Tenant layer** (`src/tenant`) — multi-tenant SaaS: engine, resolver, subscription, usage, limits, branding, config, domains, provisioner, migration, auth extension points.
7. **Production layer** (`src/production`) — environment config, security toolkit, observability, billing abstraction, authentication, launch checklist, quality UI, performance utils.

## Communication
All lifecycle/config changes publish EventBus events; AuditService and WebhookService and
the metrics collector subscribe. No service imports another service's implementation for
side effects — they coordinate through events. Every tenant-aware call takes a `TenantContext`.

## Providers & registries
AI providers, voice providers, plugins, billing providers, integrations, and auth providers
all sit behind registries/interfaces, so a new provider is a registration, not a refactor.
