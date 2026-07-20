/*
# LAVA Platform Core Infrastructure - Additive Schema (Stage 8)

Persistence for the platform services: event stream, audit log, feature flags,
configuration, plugin registry, background/scheduled jobs, webhooks, integrations,
and branding. All tables are NEW and additive — no existing table is modified.
Service logic runs in code; these tables allow durable storage + future server-side
workers/websocket fan-out to share the same shapes.

## Security
Existing convention: RLS enabled with `anon, authenticated` policies.
*/

CREATE TABLE IF NOT EXISTS system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id text,
  priority int NOT NULL DEFAULT 0,
  source text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(type);
CREATE INDEX IF NOT EXISTS idx_system_events_correlation ON system_events(correlation_id);
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_system_events" ON system_events;
CREATE POLICY "anon_all_system_events" ON system_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL,
  action text NOT NULL,
  target text,
  severity text NOT NULL DEFAULT 'info',
  correlation_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_audit_logs" ON audit_logs;
CREATE POLICY "anon_all_audit_logs" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS feature_flags (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text,
  default_enabled boolean NOT NULL DEFAULT false,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_feature_flags" ON feature_flags;
CREATE POLICY "anon_all_feature_flags" ON feature_flags FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'global',
  scope_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE configuration ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_configuration" ON configuration;
CREATE POLICY "anon_all_configuration" ON configuration FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS plugins (
  id text PRIMARY KEY,
  kind text NOT NULL,
  name text NOT NULL,
  version text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  registered_at timestamptz DEFAULT now()
);
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_plugins" ON plugins;
CREATE POLICY "anon_all_plugins" ON plugins FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  run_at timestamptz DEFAULT now(),
  error text,
  result jsonb,
  created_at timestamptz DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_background_jobs" ON background_jobs;
CREATE POLICY "anon_all_background_jobs" ON background_jobs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cron text NOT NULL,
  job_type text,
  enabled boolean NOT NULL DEFAULT true,
  last_run timestamptz,
  next_run timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_scheduled_jobs" ON scheduled_jobs;
CREATE POLICY "anon_all_scheduled_jobs" ON scheduled_jobs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  direction text NOT NULL DEFAULT 'outgoing',
  url text,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  secret text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_webhooks" ON webhooks;
CREATE POLICY "anon_all_webhooks" ON webhooks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS integrations (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  available boolean NOT NULL DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_integrations" ON integrations;
CREATE POLICY "anon_all_integrations" ON integrations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  company_name text NOT NULL DEFAULT 'LAVA',
  logo_url text,
  favicon_url text,
  primary_color text NOT NULL DEFAULT '#8B0000',
  secondary_color text NOT NULL DEFAULT '#1a1a1a',
  font_family text,
  email_template jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_branding" ON branding;
CREATE POLICY "anon_all_branding" ON branding FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
