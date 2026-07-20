// AI Voice Intelligence — types. Independent of the simulator: consumes the events
// the simulator emits (module_scores) and returns a standardized VoiceAnalysis.
// The same VoiceAnalysis shape is returned in all three modes (offline / near-real-time / live).

export type VoiceAnalysisMode = 'offline' | 'near_realtime' | 'live';

// Normalized input any analyzer consumes (extracted from a module score or a live chunk).
export interface VoiceInput {
  simulationId: string;
  transcript: string;
  words: number;
  wpm: number | null;
  durationSeconds: number;
  categoryScores: Record<string, number>;
  overallScore: number;
  turns: { role: 'learner' | 'ai'; text: string }[];
  emotionTimeline: unknown[];
}

// Feature 1 — Speech Intelligence
export interface SpeechMetrics {
  wpm: number;
  speakingSpeed: 'Slow' | 'Measured' | 'Ideal' | 'Fast' | 'Very Fast';
  avgSentenceLength: number;
  avgResponseTimeSec: number;
  thinkingTimeSec: number;
  talkTimeSec: number;
  aiTalkTimeSec: number;
  customerTalkTimeSec: number;
  listeningRatio: number; // 0-100 (% of time listening)
  conversationBalance: 'Balanced' | 'Learner-dominant' | 'Learner-passive';
  fluency: number; // 0-100
}

// Feature 2 — Pronunciation
export interface PronunciationReport {
  overall: number;
  terminologyAccuracy: number;
  carrierNames: number;
  customerNames: number;
  businessVocabulary: number;
  detectedTerms: string[];
  unknownWords: number;
  mispronouncedWords: number;
}

// Feature 3 — Filler words
export interface FillerHit { word: string; time: string; atSec: number; }
export interface FillerReport {
  total: number;
  perMinute: number;
  frequency: number; // % of words that are fillers
  byWord: { word: string; count: number }[];
  timeline: FillerHit[];
}

// Feature 4 — Silence
export interface SilenceReport {
  deadAirSec: number;
  longPauses: number;
  naturalPauses: number;
  thinkingTimeSec: number;
  customerWaitingSec: number;
  aiWaitingSec: number;
}

// Feature 5 — Interruptions
export interface InterruptionReport {
  candidateInterruptedAI: number;
  aiInterruptedCandidate: number;
  talkOverlapSec: number;
  totalInterruptions: number;
  smoothness: number; // 0-100
}

// Feature 6 — Confidence
export interface ConfidenceReport {
  confidence: number;
  hesitation: number;
  speechRhythm: number;
  sentenceCompletion: number;
  responseCertainty: number;
  voiceStability: number;
  professionalPresence: number;
}

// Feature 7 — Tone & Energy (+ emotion)
export interface ToneEnergyReport {
  friendly: number;
  professional: number;
  calm: number;
  confident: number;
  empathetic: number;
  assertive: number;
  monotone: number;
  energetic: number;
  passive: number;
  dominantEmotion: string;
}

// Feature 8 — Timeline
export type VoiceEventKind =
  | 'phase' | 'pause' | 'interruption' | 'high_confidence' | 'low_confidence'
  | 'empathy' | 'missed_opportunity' | 'recommendation';

export interface VoiceTimelineEvent {
  id: string;
  atSec: number;
  time: string;
  kind: VoiceEventKind;
  label: string;
  detail: string;
  score?: number;
}

// Feature 9 — Live coach cues
export type CueSeverity = 'positive' | 'info' | 'warning';
export interface LiveCue {
  atSec: number;
  time: string;
  message: string;
  severity: CueSeverity;
}

// Pace graph point
export interface PacePoint { label: string; wpm: number; }

// Feature 12 — recommendations
export interface VoiceRecommendation {
  title: string;
  detail: string;
  lessonModuleId?: string;
  lessonTitle?: string;
}

// The standardized response object (identical across all three modes).
export interface VoiceAnalysis {
  simulationId: string;
  mode: VoiceAnalysisMode;
  provider: string;
  createdAt: string;
  durationSeconds: number;
  moduleName: string;
  overallVoiceScore: number;
  speech: SpeechMetrics;
  pronunciation: PronunciationReport;
  fillers: FillerReport;
  silence: SilenceReport;
  interruptions: InterruptionReport;
  confidence: ConfidenceReport;
  toneEnergy: ToneEnergyReport;
  pace: PacePoint[];
  timeline: VoiceTimelineEvent[];
  liveCues: LiveCue[];
  recommendations: VoiceRecommendation[];
}

// ---- Voice provider abstraction ----
export interface VoiceProviderMetadata {
  id: string;
  name: string;
  engine: string;
  supportsStreaming: boolean;
  supportsRealtime: boolean;
  supportsDiarization: boolean;
  latencyEstimateMs: number;
  estimatedCostPerMinute: number;
  availability: 'available' | 'degraded' | 'offline';
  local: boolean;
}

export interface VoiceProvider {
  readonly metadata: VoiceProviderMetadata;
  supports(mode: VoiceAnalysisMode): boolean;
  isAvailable(): boolean;
  // Analyze a normalized input (audio transcription happens inside a real provider).
  analyze(input: VoiceInput, mode: VoiceAnalysisMode): VoiceAnalysis;
}

// ---- Persisted rows (additive tables) ----
export interface VoiceAnalysisRow {
  id?: string;
  candidate_id: string;
  simulation_id: string;
  provider: string;
  mode: string;
  overall_voice_score: number;
  duration_seconds: number;
  created_at?: string;
}

export interface VoiceScoreRow {
  id?: string;
  candidate_id: string;
  simulation_id: string;
  scores: Record<string, number>;
  created_at?: string;
}
