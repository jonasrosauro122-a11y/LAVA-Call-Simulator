/*
# LAVA Trainer & Enterprise Platform - Additive Schema (Stage 7)

Adds tables for the management layer: roles/permissions, trainer profiles & notes,
assignments & progress, cohorts & members, notifications, reports, and company
(tenant) profiles & members. All tables are NEW and additive — no existing table
is modified. Role/permission CONTENT lives in code (role & permission engines);
these tables persist assignable/tenant data and per-user overrides.

## Security
Existing convention: RLS enabled with `anon, authenticated` policies.
*/

CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  label text NOT NULL,
  rank int NOT NULL DEFAULT 0,
  description text
);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_roles" ON roles;
CREATE POLICY "anon_all_roles" ON roles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS permissions (
  id text PRIMARY KEY,
  description text
);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_permissions" ON permissions;
CREATE POLICY "anon_all_permissions" ON permissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS trainer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'trainer',
  display_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_trainer_profiles" ON trainer_profiles;
CREATE POLICY "anon_all_trainer_profiles" ON trainer_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS trainer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id text NOT NULL,
  learner_id text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trainer_notes_trainer ON trainer_notes(trainer_id);
ALTER TABLE trainer_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_trainer_notes" ON trainer_notes;
CREATE POLICY "anon_all_trainer_notes" ON trainer_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigner_id text NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  target_id text NOT NULL,
  cohort_id text,
  learner_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'medium',
  difficulty text NOT NULL DEFAULT 'Intermediate',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assignments_assigner ON assignments(assigner_id);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_assignments" ON assignments;
CREATE POLICY "anon_all_assignments" ON assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS assignment_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  completion_pct numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assignment_progress_assignment ON assignment_progress(assignment_id);
ALTER TABLE assignment_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_assignment_progress" ON assignment_progress;
CREATE POLICY "anon_all_assignment_progress" ON assignment_progress FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'class',
  trainer_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_cohorts" ON cohorts;
CREATE POLICY "anon_all_cohorts" ON cohorts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cohort_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE,
  learner_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort ON cohort_members(cohort_id);
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_cohort_members" ON cohort_members;
CREATE POLICY "anon_all_cohort_members" ON cohort_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id text,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  channel text NOT NULL DEFAULT 'in_app',
  read boolean NOT NULL DEFAULT false,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_notifications" ON notifications;
CREATE POLICY "anon_all_notifications" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_reports" ON reports;
CREATE POLICY "anon_all_reports" ON reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'trial',
  seats int NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_company_profiles" ON company_profiles;
CREATE POLICY "anon_all_company_profiles" ON company_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  role text NOT NULL DEFAULT 'learner',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_company_members" ON company_members;
CREATE POLICY "anon_all_company_members" ON company_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
