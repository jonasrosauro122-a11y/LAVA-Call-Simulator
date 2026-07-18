/*
# LAVA Learning Journey - Additive Schema

Adds the tables that power the Learning Journey layer on top of the existing
assessment platform. All tables are NEW and additive — no existing table is
altered or dropped, so current functionality is fully preserved.

## New tables
- learner_profiles     : per-candidate XP, level, streak, goals, active path
- path_enrollments     : which learning paths a candidate has started
- lesson_progress      : completed lessons
- quiz_attempts        : quiz submissions and scores
- module_simulations   : simulation results tied to a learning module
- xp_events            : XP award audit log (feeds daily/weekly goals)
- certificates         : issued path certificates

## Security
Follows the existing project convention: RLS enabled, policies grant
`anon, authenticated` access, since this is a no-auth app where the anon-key
frontend owns all reads/writes. Candidate scoping is done by column filter.
*/

-- learner_profiles ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS learner_profiles (
  candidate_id uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  xp numeric NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  streak_days int NOT NULL DEFAULT 0,
  last_active timestamptz,
  daily_goal_xp int NOT NULL DEFAULT 60,
  weekly_goal_xp int NOT NULL DEFAULT 300,
  active_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_learner_profiles" ON learner_profiles;
CREATE POLICY "anon_all_learner_profiles" ON learner_profiles
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- path_enrollments ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS path_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  path_id text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  progress_pct numeric NOT NULL DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (candidate_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_candidate ON path_enrollments(candidate_id);
ALTER TABLE path_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_path_enrollments" ON path_enrollments;
CREATE POLICY "anon_all_path_enrollments" ON path_enrollments
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- lesson_progress -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  path_id text NOT NULL,
  module_id text NOT NULL,
  lesson_id text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  completed_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_candidate ON lesson_progress(candidate_id);
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_lesson_progress" ON lesson_progress;
CREATE POLICY "anon_all_lesson_progress" ON lesson_progress
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- quiz_attempts -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  quiz_id text NOT NULL,
  path_id text NOT NULL,
  module_id text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_candidate ON quiz_attempts(candidate_id);
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_quiz_attempts" ON quiz_attempts;
CREATE POLICY "anon_all_quiz_attempts" ON quiz_attempts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- module_simulations --------------------------------------------------------
CREATE TABLE IF NOT EXISTS module_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  path_id text NOT NULL,
  module_id text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_simulations_candidate ON module_simulations(candidate_id);
ALTER TABLE module_simulations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_module_simulations" ON module_simulations;
CREATE POLICY "anon_all_module_simulations" ON module_simulations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- xp_events -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_candidate ON xp_events(candidate_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created ON xp_events(created_at DESC);
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_xp_events" ON xp_events;
CREATE POLICY "anon_all_xp_events" ON xp_events
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- certificates --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  path_id text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  issued_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_candidate ON certificates(candidate_id);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_certificates" ON certificates;
CREATE POLICY "anon_all_certificates" ON certificates
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
