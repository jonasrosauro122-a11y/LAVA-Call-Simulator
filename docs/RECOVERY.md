# Recovery Guide

## Incident response
1. Check `/admin/health` — errors, provider status, failed jobs.
2. Check the audit log (`/admin/platform` → Audit) for the correlation ID around the incident.
3. Toggle the relevant **feature flag** off to isolate a faulty subsystem without a deploy.

## Provider outage
AI/voice adapters fall back automatically; force a provider by changing the tenant's AI/voice
config or the platform default. Billing failures fall back to manual invoicing.

## Data / tenant isolation
Every record carries `tenant_id`. In production, RLS enforces
`tenant_id = current_setting('app.tenant_id')`. To rotate a leaked key, update the env var and
redeploy; secrets are never stored in code (`secrets` abstraction).

## Rollback
Builds are static; redeploy the previous `dist/`. Migrations are additive, so older builds
remain compatible with a newer schema. Jobs and schedules are idempotent and safe to replay.
