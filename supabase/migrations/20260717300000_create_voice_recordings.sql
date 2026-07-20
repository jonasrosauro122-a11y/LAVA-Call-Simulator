/*
# LAVA Voice Recording Storage - Additive Schema

Adds the `voice_recordings` table and the private `voice-recordings` storage bucket for
per-simulation microphone recordings. Fully additive — no existing table is modified.

## Storage
Bucket `voice-recordings` is PRIVATE (public = false). Objects are laid out as
`tenant_id/learner_id/yyyy/mm/simulation_id.webm`. Raw URLs are never exposed — the app
always issues short-lived signed URLs (see voiceRecordingApi.getSignedUrl).

## Security
Existing convention: RLS enabled with permissive `anon, authenticated` policies (no auth
backend yet). The commented production policies show the tenant/role-scoped rules that
activate once auth + `app.tenant_id` are in place — owner, trainer, company_admin, and
enterprise_owner only. Application-level guards (canAccessRecording) enforce this today.
*/

CREATE TABLE IF NOT EXISTS voice_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  learner_id text NOT NULL,
  simulation_id text NOT NULL,
  module_id text,
  scenario_id text,
  provider text,
  storage_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'audio/webm',
  duration_seconds numeric NOT NULL DEFAULT 0,
  file_size bigint NOT NULL DEFAULT 0,
  transcript text,
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_recordings_tenant ON voice_recordings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_learner ON voice_recordings(learner_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_simulation ON voice_recordings(simulation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_recordings_sim_unique ON voice_recordings(tenant_id, simulation_id);

ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_voice_recordings" ON voice_recordings;
CREATE POLICY "anon_all_voice_recordings" ON voice_recordings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

/*
-- PRODUCTION RLS (enable once auth + app.tenant_id are configured):
-- CREATE POLICY "tenant_read_voice_recordings" ON voice_recordings FOR SELECT TO authenticated
--   USING (tenant_id = current_setting('app.tenant_id')::uuid
--     AND (learner_id = auth.uid()::text
--          OR current_setting('app.role') IN ('trainer','training_manager','supervisor','admin','company_admin','enterprise_owner')));
-- CREATE POLICY "owner_write_voice_recordings" ON voice_recordings FOR INSERT TO authenticated
--   WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid AND learner_id = auth.uid()::text);
*/

-- Trigger to keep updated_at fresh.
CREATE OR REPLACE FUNCTION set_voice_recording_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_voice_recordings_updated_at ON voice_recordings;
CREATE TRIGGER trg_voice_recordings_updated_at BEFORE UPDATE ON voice_recordings
  FOR EACH ROW EXECUTE FUNCTION set_voice_recording_updated_at();

-- Private storage bucket for recordings.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('voice-recordings', 'voice-recordings', false, 104857600, ARRAY['audio/webm','audio/ogg','audio/mpeg','audio/wav'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: permissive for anon/authenticated today (consistent with app convention).
-- Production tenant/role scoping is enforced in the app (canAccessRecording) + the commented
-- policies above until an auth backend is attached.
DROP POLICY IF EXISTS "anon_voice_recordings_objects" ON storage.objects;
CREATE POLICY "anon_voice_recordings_objects" ON storage.objects FOR ALL TO anon, authenticated
  USING (bucket_id = 'voice-recordings') WITH CHECK (bucket_id = 'voice-recordings');
