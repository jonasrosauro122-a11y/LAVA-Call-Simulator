// AI Communication Intelligence — analysis layer types.
// This layer is independent of the simulator: it consumes the data the simulator
// already emits (module_scores) and produces analyses, coaching, and recommendations.

export const METRICS = [
  'Grammar', 'Vocabulary', 'Pronunciation', 'Sentence Structure', 'Speaking Confidence',
  'Professionalism', 'Critical Thinking', 'Listening Skills', 'Active Listening', 'Empathy',
  'Rapport Building', 'Persuasiveness', 'Objection Handling', 'Problem Solving', 'Customer Focus',
  'Sales Skills', 'Organization', 'Tone', 'Energy', 'Pacing', 'Clarity', 'Response Quality', 'Completeness',
] as const;

export type Metric = typeof METRICS[number];

export type CommunicationScores = Record<Metric, number>;

export interface SimulationAnalysis {
  id: string;
  simulationId: string;
  pathId?: string;
  pathTitle?: string;
  moduleId?: string;
  moduleName: string;
  moduleNumber: number;
  scenario: string;
  durationSeconds: number;
  transcript: string;
  aiResponse: string;
  candidateResponse: string;
  timestamp: string;
  overallScore: number;
  communicationScore: number;
  scores: CommunicationScores;
}

export interface TimelineSegment {
  time: string;
  phase: string;
  note: string;
  feedback: string;
  score: number;
}

export interface AICoachReport {
  strengths: string[];
  improvements: string[];
  grammarSuggestions: string[];
  vocabularySuggestions: string[];
  confidenceTips: string[];
  recommendedPractice: string[];
  nextLesson: { pathId: string; moduleId: string; title: string } | null;
  recommendedSimulation: { moduleNumber: number; name: string; reason: string } | null;
  learningResources: { title: string; type: string }[];
}

export type RecommendationKind = 'lesson' | 'module' | 'simulation' | 'path';

export interface Recommendation {
  kind: RecommendationKind;
  title: string;
  reason: string;
  to: string; // route
  weakSkill?: Metric;
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';

export interface DifficultyState {
  level: DifficultyLevel;
  index: number; // 0..4
  rationale: string;
  nextLevel: DifficultyLevel | null;
}

export interface TrendPoint {
  date: string;
  label: string;
  [metric: string]: string | number;
}

export interface RadarAxis {
  skill: string;
  score: number;
}

// ---- Persisted rows (additive tables) ----
export interface SimulationAnalysisRow {
  id?: string;
  candidate_id: string;
  simulation_id: string;
  path_id: string | null;
  module_name: string;
  scenario: string;
  duration_seconds: number;
  overall_score: number;
  communication_score: number;
  created_at?: string;
}

export interface CommunicationScoreRow {
  id?: string;
  candidate_id: string;
  simulation_id: string;
  scores: CommunicationScores;
  created_at?: string;
}

export interface AiFeedbackRow {
  id?: string;
  candidate_id: string;
  simulation_id: string;
  report: AICoachReport;
  created_at?: string;
}

export interface DifficultyHistoryRow {
  id?: string;
  candidate_id: string;
  level: string;
  index: number;
  created_at?: string;
}
