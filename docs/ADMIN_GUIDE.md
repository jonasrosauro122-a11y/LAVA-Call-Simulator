# Administrator Guide

## Consoles
- `/trainer` — trainer console (role switcher in header for demo).
- `/admin/platform` — infrastructure: event bus, audit log, feature flags, config, plugins,
  jobs, scheduler, webhooks, integrations, branding.
- `/admin/tenants` — create/suspend/reactivate/archive/soft-delete/clone tenants; search/filter.
- `/admin/tenant/:id` — per-tenant usage, limits, plan, flags, AI/voice config, domains, audit.
- `/admin/launch` — production readiness verification.
- `/admin/health` — live metrics, provider status, timings, errors.
Access requires the `manage_roles` permission (admin+); switch role in the console header.

## Auth (demo → production)
Local email/password works out of the box. For production, attach a `CredentialProvider`
(Supabase Auth or SSO) via `authService.setProvider()`. Verification/reset tokens are issued
by `authService` and would be emailed once an email provider is configured.

## Tenants & plans
Plans (Free→Custom) define limits + feature access. Feature flags resolve as
`tenant flag AND plan entitlement`. Usage is metered per tenant; limit breaches publish
`TenantLimitsExceeded`.
