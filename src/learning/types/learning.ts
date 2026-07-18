import type { PositionId } from '../../lib/positionBank';

// ---------------------------------------------------------------------------
// Authored content types (defined in code, versioned with the app)
// ---------------------------------------------------------------------------

export type LessonBlockType = 'concept' | 'example' | 'tip' | 'keyTerms' | 'script';

export interface LessonBlock {
  type: LessonBlockType;
  title?: string;
  body?: string;
  items?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  blocks: LessonBlock[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  passingScore: number; // percentage required to pass
  questions: QuizQuestion[];
}

export type PracticeKind = 'flashcards' | 'prompt' | 'reorder';

export interface PracticeActivity {
  id: string;
  title: string;
  kind: PracticeKind;
  instructions: string;
  prompt?: string;
  terms?: { term: string; definition: string }[];
  steps?: string[];
}

export interface SimulationRequirement {
  moduleNumber: number; // maps to an existing assessment MODULE (1..7)
  moduleName: string;
  minScore: number; // score needed to clear this module
  description: string;
}

export interface CourseModule {
  id: string;
  title: string;
  objectives: string[];
  estimatedMinutes: number;
  lessons: Lesson[];
  practice: PracticeActivity[];
  quiz: Quiz;
  simulation: SimulationRequirement;
  xpReward: number;
}

export type PathLevel = 'Foundational' | 'Core' | 'Specialized';

export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: string; // lucide-react icon name
  level: PathLevel;
  positionId?: PositionId; // links to role content; omitted for role-agnostic paths
  estimatedHours: number;
  skills: string[];
  modules: CourseModule[];
}

// ---------------------------------------------------------------------------
// Learner state types (persisted per candidate in Supabase)
// ---------------------------------------------------------------------------

export interface LearnerProfile {
  candidate_id: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active: string | null;
  daily_goal_xp: number;
  weekly_goal_xp: number;
  active_path: string | null;
  created_at?: string;
  updated_at?: string;
}

export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed';

export interface PathEnrollment {
  id?: string;
  candidate_id: string;
  path_id: string;
  status: EnrollmentStatus;
  progress_pct: number;
  enrolled_at?: string;
  completed_at?: string | null;
}

export interface LessonProgressRow {
  id?: string;
  candidate_id: string;
  path_id: string;
  module_id: string;
  lesson_id: string;
  status: 'completed';
  completed_at?: string;
}

export interface QuizAttemptRow {
  id?: string;
  candidate_id: string;
  quiz_id: string;
  path_id: string;
  module_id: string;
  score: number;
  passed: boolean;
  answers: number[];
  created_at?: string;
}

export interface XpEventRow {
  id?: string;
  candidate_id: string;
  amount: number;
  reason: string;
  created_at?: string;
}

export interface CertificateRow {
  id?: string;
  candidate_id: string;
  path_id: string;
  score: number;
  issued_at?: string;
}

export interface SimulationResultRow {
  id?: string;
  candidate_id: string;
  path_id: string;
  module_id: string;
  score: number;
  passed: boolean;
  created_at?: string;
}

// ---- Gamification (Stage 3) row types ----

export interface StreakRow {
  candidate_id: string;
  current_streak: number;
  longest_streak: number;
  last_active: string | null; // ISO date (YYYY-MM-DD)
  updated_at?: string;
}

export interface AchievementProgressRow {
  id?: string;
  candidate_id: string;
  achievement_id: string;
  unlocked_at?: string;
}

export interface ChallengeClaimRow {
  id?: string;
  candidate_id: string;
  challenge_id: string; // daily-YYYY-MM-DD-i or weekly-YYYY-Wnn-key
  claimed_at?: string;
}

export interface RankHistoryRow {
  id?: string;
  candidate_id: string;
  rank_index: number;
  rank_name: string;
  reached_at?: string;
}

// ---------------------------------------------------------------------------
// Derived (computed) progress types used by the UI
// ---------------------------------------------------------------------------

export type ProgressStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface ModuleProgress {
  moduleId: string;
  status: ProgressStatus;
  lessonsDone: number;
  lessonsTotal: number;
  quizPassed: boolean;
  simulationScore: number | null;
  simulationPassed: boolean;
  complete: boolean;
}

export interface PathProgress {
  pathId: string;
  modules: ModuleProgress[];
  completedModules: number;
  totalModules: number;
  progressPct: number;
  complete: boolean;
}

export type XpReason =
  | 'lesson_complete'
  | 'quiz_pass'
  | 'quiz_perfect'
  | 'simulation_pass'
  | 'module_complete'
  | 'path_complete'
  | 'daily_streak'
  | 'achievement'
  | 'daily_challenge'
  | 'weekly_goal';
