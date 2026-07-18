// Dynamic Scenario Engine — types. Each engine module has a single responsibility;
// the Scenario Composer combines them into one GeneratedScenario.

export type CommunicationStyle = 'direct' | 'chatty' | 'formal' | 'casual' | 'terse' | 'warm';

export type AccentProfile =
  | 'American' | 'Southern US' | 'New York' | 'British' | 'Australian'
  | 'Indian' | 'Filipino' | 'Spanish-influenced English';

export type Emotion =
  | 'Happy' | 'Neutral' | 'Confused' | 'Frustrated' | 'Anxious'
  | 'Excited' | 'Impatient' | 'Curious' | 'Disappointed' | 'Satisfied';

export type EmotionTrigger =
  | 'good_answer' | 'bad_answer' | 'interruption' | 'long_silence'
  | 'incorrect_info' | 'excellent_empathy' | 'objection_handled';

export type ConversationPhase =
  | 'Greeting' | 'Rapport' | 'Discovery' | 'Qualification' | 'Problem Identification'
  | 'Education' | 'Recommendation' | 'Objection Handling' | 'Closing' | 'Wrap-up';

export type ScenarioDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';

export type Vocabulary = 'simple' | 'everyday' | 'professional' | 'technical';

// Feature 8: voice/accent metadata only (no audio generated in this stage).
export interface VoiceMeta {
  accent: AccentProfile;
  gender: 'neutral' | 'female' | 'male';
  pace: 'slow' | 'medium' | 'fast';
  provider: string | null; // future voice provider id
}

export interface Personality {
  id: string;
  name: string;
  archetype: string;
  communicationStyle: CommunicationStyle;
  patience: number; // 0-100
  knowledge: number; // 0-100
  responseStyle: string;
  formality: number; // 0-100
  trust: number; // 0-100
  vocabulary: Vocabulary;
  questionComplexity: 'low' | 'medium' | 'high';
  decisionBehavior: 'impulsive' | 'deliberate' | 'hesitant' | 'analytical';
  roles: string[]; // roles this persona fits
  accent: AccentProfile;
  baseEmotion: Emotion;
  voice: VoiceMeta;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  priority: 'primary' | 'secondary';
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  effect: string;
}

export interface ScenarioType {
  id: string;
  label: string;
  expectedSkills: string[];
  learningObjectives: string[];
  estimatedMinutes: number;
}

export interface ConversationMemoryData {
  facts: Record<string, string>;
  askedQuestions: string[];
  promises: string[];
  history: { role: 'ai' | 'learner'; text: string; phase: ConversationPhase }[];
}

export interface ConversationStateData {
  phase: ConversationPhase;
  phaseIndex: number;
  turn: number;
}

export interface GeneratedScenario {
  id: string;
  seed: number;
  role: string;
  pathId?: string;
  moduleId?: string;
  scenarioType: ScenarioType;
  personality: Personality;
  emotion: Emotion;
  goals: Goal[];
  difficulty: ScenarioDifficulty;
  events: RandomEvent[];
  phases: ConversationPhase[];
  expectedSkills: string[];
  learningObjectives: string[];
  estimatedMinutes: number;
  openingLine: string;
  systemPrompt: string;
  createdAt: string;
}

export interface ComposeInput {
  role: string;
  pathId?: string;
  moduleId?: string;
  seed?: number;
  difficulty?: ScenarioDifficulty;
}

// ---- Persisted rows (additive tables) ----
export interface ScenarioInstanceRow {
  id?: string;
  candidate_id: string;
  scenario_id: string;
  role: string;
  path_id: string | null;
  personality: string;
  emotion: string;
  goals: string[];
  difficulty: string;
  scenario_type: string;
  created_at?: string;
}

export interface SimulationSessionRow {
  id?: string;
  candidate_id: string;
  scenario_id: string;
  outcome: string; // 'pending' | 'completed' | 'abandoned'
  completion: number; // 0-100
  score: number | null;
  created_at?: string;
}
