/*
# LAVA Voice Intelligence - Additive Schema (Stage 6)

Adds tables for voice analysis, metrics, events, timeline, history, recommendations,
scores, and sessions. All tables are NEW and additive — no existing table is
modified. The UI derives voice analyses in memory from existing `module_scores`;
these tables persist the derived intelligence for history and future services
(including future real-time streaming providers).

## Security
Existing convention: RLS enabled with `anon, authenticated` policies.
*/

CREATE TABLE IF NOT EXISTS voice_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  provider text NOT NULL,
  mode text NOT NULL DEFAULT 'offline',
  overall_voice_score numeric NOT NULL DEFAULT 0,
  duration_seconds numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, simulation_id)
);
CREATE INDEX IF NOT EXISTS idx_voice_analysis_candidate ON voice_analysis(candidate_id);
ALTER TABLE voice_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_voice_analysis" ON voice_analysis;
CREATE POLICY "anon_all_voice_analysis" ON voice_analysis FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS voice_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_metrics_candidate ON voice_metrics(candidate_id);
ALTER TABLE voice_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_voice_metrics" ON voice_metrics;
CREATE POLICY "anon_all_voice_metrics" ON voice_metrics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS voice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  kind text NOT NULL,
  at_sec numeric NOT NULL DEFAULT 0,
  label text,
  detail text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_events_candidate ON voice_events(candidate_id);
ALTER TABLE voice_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_voice_events" ON voice_events;
CREATE POLICY "anon_all_voice_events" ON voice_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS speech_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_speech_timeline_candidate ON speech_timeline(candidate_id);
ALTER TABLE speech_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_speech_timeline" ON speech_timeline;
CREATE POLICY "anon_all_speech_timeline" ON speech_timeline FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS voice_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  metric text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  simulation_id text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_history_candidate ON voice_history(candidate_id);
ALTER TABLE voice_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_voice_history" ON voice_history;
CREATE POLICY "anon_all_voice_history" ON voice_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS voice_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  title text NOT NULL,
  detail text,
  lesson_module_id text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_recs_candidate ON voice_recommendations(candidate_id);
ALTER TABLE voice_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_voice_recommendations" ON voice_recommendations;
CREATE POLICY "anon_all_voice_recommendations" ON voice_recommendations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS voice_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, simulation_id)
);
CREATE INDEX IF NOT EXISTS idx_voice_scores_candidate ON voice_scores(candidate_id);
ALTER TABLE voice_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_voice_scores" ON voice_scores;
CREATE POLICY "anon_all_voice_scores" ON voice_scores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  provider text NOT NULL,
  mode text NOT NULL DEFAULT 'offline',
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_candidate ON voice_sessions(candidate_id);
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_voice_sessions" ON voice_sessions;
CREATE POLICY "anon_all_voice_sessions" ON voice_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
