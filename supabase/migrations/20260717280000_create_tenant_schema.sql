/*
# LAVA Multi-Tenant SaaS - Additive Schema (Stage 9)

Introduces the tenant model and its per-tenant configuration/usage tables. Every table
carries a `tenant_id` so records are isolated by organization. All tables are NEW and
additive — existing tables are NOT modified.

## Isolation strategy (production)
Today RLS uses the existing permissive anon policy (no auth). When backend auth lands,
each policy becomes `tenant_id = current_setting('app.tenant_id')::uuid`, and the app
sets that GUC from the authenticated session's tenant claim. Because every service
already receives a TenantContext, no business logic changes — only TenantResolver's
source of truth and the RLS predicates. Existing feature tables gain a nullable
`tenant_id` in a later backfill migration; nothing is altered destructively here.
*/

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  plan text NOT NULL DEFAULT 'starter',
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenants" ON tenants;
CREATE POLICY "anon_all_tenants" ON tenants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_settings" ON tenant_settings;
CREATE POLICY "anon_all_tenant_settings" ON tenant_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT 'Organization',
  logo_url text, favicon_url text,
  primary_color text NOT NULL DEFAULT '#8B0000',
  secondary_color text NOT NULL DEFAULT '#1a1a1a',
  font_family text,
  login_headline text, dashboard_banner text,
  certificate_branding text, email_branding text,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant ON tenant_branding(tenant_id);
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_branding" ON tenant_branding;
CREATE POLICY "anon_all_tenant_branding" ON tenant_branding FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  provider text, model text, fallback_provider text, routing_strategy text,
  temperature numeric DEFAULT 0.7, max_tokens int DEFAULT 1024,
  streaming boolean DEFAULT false, cost_limit_usd numeric DEFAULT 100,
  prompt_templates jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_ai_config_tenant ON tenant_ai_config(tenant_id);
ALTER TABLE tenant_ai_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_ai_config" ON tenant_ai_config;
CREATE POLICY "anon_all_tenant_ai_config" ON tenant_ai_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_voice_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  speech_provider text, realtime_provider text, language text DEFAULT 'en', accent text,
  confidence_threshold numeric DEFAULT 0.6,
  custom_vocabulary jsonb DEFAULT '[]'::jsonb,
  pronunciation_dictionary jsonb DEFAULT '{}'::jsonb,
  analysis_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_voice_config_tenant ON tenant_voice_config(tenant_id);
ALTER TABLE tenant_voice_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_voice_config" ON tenant_voice_config;
CREATE POLICY "anon_all_tenant_voice_config" ON tenant_voice_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  flag_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_tenant ON tenant_feature_flags(tenant_id);
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_feature_flags" ON tenant_feature_flags;
CREATE POLICY "anon_all_tenant_feature_flags" ON tenant_feature_flags FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS subscription_plans (
  tier text PRIMARY KEY,
  name text NOT NULL,
  price_hint text,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '[]'::jsonb
);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_subscription_plans" ON subscription_plans;
CREATE POLICY "anon_all_subscription_plans" ON subscription_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  metric text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  period text DEFAULT 'current',
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant ON tenant_usage(tenant_id);
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_usage" ON tenant_usage;
CREATE POLICY "anon_all_tenant_usage" ON tenant_usage FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_limits_tenant ON tenant_limits(tenant_id);
ALTER TABLE tenant_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_limits" ON tenant_limits;
CREATE POLICY "anon_all_tenant_limits" ON tenant_limits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  host text UNIQUE NOT NULL,
  kind text NOT NULL DEFAULT 'subdomain',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_domains" ON tenant_domains;
CREATE POLICY "anon_all_tenant_domains" ON tenant_domains FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_provisioning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_provisioning_tenant ON tenant_provisioning(tenant_id);
ALTER TABLE tenant_provisioning ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_provisioning" ON tenant_provisioning;
CREATE POLICY "anon_all_tenant_provisioning" ON tenant_provisioning FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tenant_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  actor text NOT NULL,
  action text NOT NULL,
  target text,
  severity text NOT NULL DEFAULT 'info',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_audit_tenant ON tenant_audit(tenant_id);
ALTER TABLE tenant_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_tenant_audit" ON tenant_audit;
CREATE POLICY "anon_all_tenant_audit" ON tenant_audit FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
