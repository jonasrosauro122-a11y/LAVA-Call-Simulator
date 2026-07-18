/*
# LAVA Gamification - Additive Schema (Stage 3)

Adds the tables that power streaks, achievements, daily/weekly challenge claims,
and rank history. All tables are NEW and additive — no existing table is altered
or dropped, so every current feature keeps working.

## New tables
- daily_streaks        : current/longest streak + last active date per candidate
- achievement_progress : which achievements a candidate has unlocked
- challenge_progress   : claimed daily challenges, weekly goals, and module-award guards
- rank_history         : audit log of rank promotions (future analytics)

## Security
Follows the existing project convention: RLS enabled with policies granting
`anon, authenticated` access (this is a no-auth app whose anon-key frontend owns
all reads/writes). Candidate scoping is done by column filter.
*/

-- daily_streaks -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_streaks (
  candidate_id uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_daily_streaks" ON daily_streaks;
CREATE POLICY "anon_all_daily_streaks" ON daily_streaks
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- achievement_progress ------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievement_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_progress_candidate ON achievement_progress(candidate_id);
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_achievement_progress" ON achievement_progress;
CREATE POLICY "anon_all_achievement_progress" ON achievement_progress
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- challenge_progress --------------------------------------------------------
-- Stores idempotent "claim" markers. challenge_id encodes the source:
--   daily-YYYY-MM-DD-i | weekly-YYYY-Wnn-key | module-<moduleId>
CREATE TABLE IF NOT EXISTS challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  challenge_id text NOT NULL,
  claimed_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_progress_candidate ON challenge_progress(candidate_id);
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_challenge_progress" ON challenge_progress;
CREATE POLICY "anon_all_challenge_progress" ON challenge_progress
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- rank_history --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rank_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  rank_index int NOT NULL,
  rank_name text NOT NULL,
  reached_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rank_history_candidate ON rank_history(candidate_id);
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_rank_history" ON rank_history;
CREATE POLICY "anon_all_rank_history" ON rank_history
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
