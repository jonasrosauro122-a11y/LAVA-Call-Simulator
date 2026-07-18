/*
# LAVA Dynamic Scenario Engine - Additive Schema (Stage 5)

Adds tables for dynamically generated scenarios, personas, memory/state, events,
and simulation sessions. All tables are NEW and additive — no existing table is
modified. Persona/emotion/scenario CONTENT lives in code (the engine libraries);
these tables store per-candidate generated instances and runtime state.

## New tables
- scenario_templates    : reusable scenario blueprints (future authoring)
- scenario_instances    : each generated scenario for a candidate
- personality_profiles  : optional persisted persona overrides (future)
- emotion_profiles       : optional persisted emotion configs (future)
- conversation_memory   : per-session remembered facts/promises (future runtime)
- conversation_state    : per-session phase/turn tracking (future runtime)
- scenario_events       : injected random events per session (future)
- simulation_sessions   : outcome/score per scenario run

## Security
Existing convention: RLS enabled with `anon, authenticated` policies.
*/

CREATE TABLE IF NOT EXISTS scenario_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  label text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scenario_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_scenario_templates" ON scenario_templates;
CREATE POLICY "anon_all_scenario_templates" ON scenario_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS scenario_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  scenario_id text NOT NULL,
  role text NOT NULL,
  path_id text,
  personality text NOT NULL,
  emotion text NOT NULL,
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  difficulty text NOT NULL,
  scenario_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, scenario_id)
);
CREATE INDEX IF NOT EXISTS idx_scenario_instances_candidate ON scenario_instances(candidate_id);
ALTER TABLE scenario_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_scenario_instances" ON scenario_instances;
CREATE POLICY "anon_all_scenario_instances" ON scenario_instances FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS personality_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  profile_id text NOT NULL,
  overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE personality_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_personality_profiles" ON personality_profiles;
CREATE POLICY "anon_all_personality_profiles" ON personality_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS emotion_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  profile_id text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE emotion_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_emotion_profiles" ON emotion_profiles;
CREATE POLICY "anon_all_emotion_profiles" ON emotion_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS conversation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  scenario_id text NOT NULL,
  memory jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_candidate ON conversation_memory(candidate_id);
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_conversation_memory" ON conversation_memory;
CREATE POLICY "anon_all_conversation_memory" ON conversation_memory FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS conversation_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  scenario_id text NOT NULL,
  phase text NOT NULL,
  turn int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversation_state_candidate ON conversation_state(candidate_id);
ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_conversation_state" ON conversation_state;
CREATE POLICY "anon_all_conversation_state" ON conversation_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS scenario_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  scenario_id text NOT NULL,
  event_id text NOT NULL,
  triggered_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scenario_events_candidate ON scenario_events(candidate_id);
ALTER TABLE scenario_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_scenario_events" ON scenario_events;
CREATE POLICY "anon_all_scenario_events" ON scenario_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS simulation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  scenario_id text NOT NULL,
  outcome text NOT NULL DEFAULT 'pending',
  completion numeric NOT NULL DEFAULT 0,
  score numeric,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_simulation_sessions_candidate ON simulation_sessions(candidate_id);
ALTER TABLE simulation_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_simulation_sessions" ON simulation_sessions;
CREATE POLICY "anon_all_simulation_sessions" ON simulation_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
