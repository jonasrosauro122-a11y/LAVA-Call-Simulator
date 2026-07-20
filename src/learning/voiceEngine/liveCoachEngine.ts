import type {
  VoiceInput, LiveCue, SpeechMetrics, FillerReport, ConfidenceReport, InterruptionReport, ToneEnergyReport,
} from './types';
import { fmtTime } from './extract';

interface CoachParts {
  input: VoiceInput;
  speech: SpeechMetrics;
  fillers: FillerReport;
  confidence: ConfidenceReport;
  interruptions: InterruptionReport;
  toneEnergy: ToneEnergyReport;
}

// Feature 9 — generate coaching cues from a completed analysis (offline).
// The same cue vocabulary is emitted live by LiveCoachStream (below).
export function generateCues(parts: CoachParts): LiveCue[] {
  const { input, speech, fillers, confidence, interruptions, toneEnergy } = parts;
  const dur = Math.max(input.durationSeconds, 30);
  const cues: LiveCue[] = [];
  const add = (frac: number, message: string, severity: LiveCue['severity']) => {
    const atSec = Math.round(dur * frac);
    cues.push({ atSec, time: fmtTime(atSec), message, severity });
  };

  if (speech.speakingSpeed === 'Fast' || speech.speakingSpeed === 'Very Fast') add(0.2, 'Slow down.', 'warning');
  if (fillers.perMinute >= 4) add(0.35, 'Avoid filler words.', 'warning');
  if (speech.conversationBalance === 'Learner-dominant') add(0.45, 'Ask another question.', 'info');
  if (toneEnergy.empathetic < 55) add(0.5, 'Show empathy.', 'info');
  if (interruptions.totalInterruptions > 0) add(0.6, "Don't interrupt.", 'warning');
  if (confidence.sentenceCompletion < 60) add(0.7, 'Clarify your answer.', 'info');
  if (confidence.confidence >= 78) add(0.8, 'Great job — strong confidence.', 'positive');
  if (toneEnergy.empathetic >= 70) add(0.55, 'Excellent discovery and empathy.', 'positive');

  return cues.sort((a, b) => a.atSec - b.atSec);
}

const FILLERS = ['um', 'uh', 'like', 'basically', 'literally', 'you know'];

export type CueHandler = (cue: LiveCue) => void;

// Feature 9 architecture — a streaming controller for near-real-time / live modes.
// Business logic pushes transcript chunks; the stream emits standardized LiveCue
// objects. A future streaming provider wires audio → chunks with no other changes.
export class LiveCoachStream {
  private buffer = '';
  private lastQuestionAt = 0;
  private running = false;

  constructor(private onCue: CueHandler) {}

  start(): void { this.running = true; }
  stop(): void { this.running = false; }
  isRunning(): boolean { return this.running; }

  // Feed a transcript chunk captured at `atSec`. Emits cues as rules fire.
  pushChunk(text: string, atSec: number): void {
    if (!this.running) return;
    this.buffer += ` ${text.toLowerCase()}`;
    const emit = (message: string, severity: LiveCue['severity']) =>
      this.onCue({ atSec, time: fmtTime(atSec), message, severity });

    if (FILLERS.some((f) => text.toLowerCase().includes(f))) emit('Avoid filler words.', 'warning');
    if (text.includes('?')) this.lastQuestionAt = atSec;
    else if (atSec - this.lastQuestionAt > 40) { emit('Ask another question.', 'info'); this.lastQuestionAt = atSec; }
    if (text.split(/\s+/).length > 60) emit('Slow down.', 'warning');
  }
}
