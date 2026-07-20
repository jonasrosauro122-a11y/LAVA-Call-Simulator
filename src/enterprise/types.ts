// Trainer & Enterprise Platform — domain types. A completely separate management
// layer; the learner experience is untouched. All types are additive.

export type Role =
  | 'learner'
  | 'trainer'
  | 'training_manager'
  | 'supervisor'
  | 'admin'
  | 'company_admin'
  | 'enterprise_owner';

export type Permission =
  | 'view_own_progress'
  | 'view_learners'
  | 'manage_learners'
  | 'assign_content'
  | 'view_assignments'
  | 'manage_cohorts'
  | 'view_cohorts'
  | 'view_analytics'
  | 'give_feedback'
  | 'send_notifications'
  | 'generate_reports'
  | 'view_company'
  | 'manage_company'
  | 'manage_roles';

export interface RoleDefinition {
  id: Role;
  label: string;
  rank: number; // higher = more privileged; inherits lower-rank permissions
  description: string;
}

// A learner as seen by management (aggregated, read-only).
export interface LearnerSummary {
  id: string;
  name: string;
  email: string;
  avatarSeed: string;
  cohortId: string | null;
  department: string;
  enrolledPaths: number;
  activePathTitle: string;
  progressPct: number;
  avgScore: number;
  simulations: number;
  communicationScore: number;
  voiceScore: number;
  confidence: number;
  xp: number;
  level: number;
  streak: number;
  certificates: number;
  achievements: number;
  attendancePct: number;
  lastActiveDaysAgo: number;
  atRisk: boolean;
  trend: number; // -100..100 recent movement
  isCurrentUser: boolean;
}

export interface Cohort {
  id: string;
  name: string;
  kind: 'class' | 'group' | 'department' | 'batch';
  trainerId: string;
  memberIds: string[];
  createdAt: string;
}

export interface CohortStats {
  cohort: Cohort;
  learners: number;
  avgScore: number;
  avgVoiceScore: number;
  avgProgress: number;
  completionRate: number;
  atRisk: number;
}

export type AssignmentType = 'path' | 'module' | 'simulation' | 'quiz' | 'voice';
export type Priority = 'low' | 'medium' | 'high';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Assignment {
  id: string;
  title: string;
  type: AssignmentType;
  targetId: string;
  assignerId: string;
  learnerIds: string[];
  cohortId: string | null;
  dueAt: string;
  priority: Priority;
  difficulty: Difficulty;
  createdAt: string;
}

export interface AssignmentProgressRow {
  assignmentId: string;
  learnerId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  completionPct: number;
}

export interface AssignmentWithProgress {
  assignment: Assignment;
  completionRate: number;
  completed: number;
  total: number;
  overdue: boolean;
}

export type NotificationKind =
  | 'assignment' | 'deadline' | 'achievement' | 'certificate'
  | 'feedback' | 'system';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'slack';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  channel: NotificationChannel;
  createdAt: string;
  read: boolean;
  acknowledged: boolean;
  learnerId?: string;
}

export interface TrainerFeedback {
  id: string;
  learnerId: string;
  trainerId: string;
  comment: string;
  rating: number; // 1-5
  recommendations: string[];
  actionItems: { text: string; done: boolean }[];
  acknowledgedByLearner: boolean;
  createdAt: string;
}

export interface TrainerNote {
  id: string;
  learnerId: string;
  trainerId: string;
  text: string;
  createdAt: string;
}

export type ReportType =
  | 'individual_progress' | 'team_progress' | 'learning_completion'
  | 'voice_improvement' | 'simulation_results' | 'certification_status'
  | 'leaderboard' | 'attendance';

export interface ReportModel {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  columns: string[];
  rows: (string | number)[][];
  summary: { label: string; value: string | number }[];
}

export type ExportFormat = 'csv' | 'pdf' | 'excel';

// ---- Persisted rows (additive tables) ----
export interface TrainerProfileRow { id?: string; candidate_id: string; role: string; display_name: string; created_at?: string; }
export interface CompanyProfileRow { id?: string; name: string; seats: number; plan: string; created_at?: string; }
