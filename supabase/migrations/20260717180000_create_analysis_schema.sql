/*
# LAVA AI Analysis - Additive Schema (Stage 4)

Adds the tables for the Communication Intelligence layer. All tables are NEW and
additive — no existing table is modified or dropped, so every current feature keeps
working. The UI derives analyses from existing `module_scores` in memory; these
tables persist the derived intelligence for history and future services.

## New tables
- simulation_analysis     : one row per analyzed simulation (summary)
- communication_scores    : the 23 detailed metrics per simulation (jsonb)
- ai_feedback             : generated AI coach report per simulation (jsonb)
- difficulty_history      : adaptive-difficulty changes over time
- skill_history           : per-skill score snapshots (future trend storage)
- learning_recommendations: generated recommendations (future persistence)
- scenario_history        : recommended/attempted scenarios (future)

## Security
Follows the existing convention: RLS enabled with `anon, authenticated` policies.
*/

CREATE TABLE IF NOT EXISTS simulation_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  path_id text,
  module_name text NOT NULL,
  scenario text,
  duration_seconds numeric NOT NULL DEFAULT 0,
  overall_score numeric NOT NULL DEFAULT 0,
  communication_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, simulation_id)
);
CREATE INDEX IF NOT EXISTS idx_sim_analysis_candidate ON simulation_analysis(candidate_id);
ALTER TABLE simulation_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_simulation_analysis" ON simulation_analysis;
CREATE POLICY "anon_all_simulation_analysis" ON simulation_analysis FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS communication_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, simulation_id)
);
CREATE INDEX IF NOT EXISTS idx_comm_scores_candidate ON communication_scores(candidate_id);
ALTER TABLE communication_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_communication_scores" ON communication_scores;
CREATE POLICY "anon_all_communication_scores" ON communication_scores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  simulation_id text NOT NULL,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, simulation_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_candidate ON ai_feedback(candidate_id);
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_ai_feedback" ON ai_feedback;
CREATE POLICY "anon_all_ai_feedback" ON ai_feedback FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS difficulty_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  level text NOT NULL,
  index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_difficulty_history_candidate ON difficulty_history(candidate_id);
ALTER TABLE difficulty_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_difficulty_history" ON difficulty_history;
CREATE POLICY "anon_all_difficulty_history" ON difficulty_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS skill_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  simulation_id text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_skill_history_candidate ON skill_history(candidate_id);
ALTER TABLE skill_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_skill_history" ON skill_history;
CREATE POLICY "anon_all_skill_history" ON skill_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS learning_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  to_route text,
  reason text,
  weak_skill text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_learning_recs_candidate ON learning_recommendations(candidate_id);
ALTER TABLE learning_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_learning_recommendations" ON learning_recommendations;
CREATE POLICY "anon_all_learning_recommendations" ON learning_recommendations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS scenario_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  scenario text NOT NULL,
  module_number int,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scenario_history_candidate ON scenario_history(candidate_id);
ALTER TABLE scenario_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_scenario_history" ON scenario_history;
CREATE POLICY "anon_all_scenario_history" ON scenario_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
