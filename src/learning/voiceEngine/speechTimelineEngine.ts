import type {
  VoiceInput, VoiceTimelineEvent, ConfidenceReport, FillerReport, SilenceReport,
  InterruptionReport, ToneEnergyReport,
} from './types';
import { fmtTime } from './extract';

interface TimelineParts {
  input: VoiceInput;
  confidence: ConfidenceReport;
  fillers: FillerReport;
  silence: SilenceReport;
  interruptions: InterruptionReport;
  toneEnergy: ToneEnergyReport;
}

const PHASES: { at: number; label: string }[] = [
  { at: 0.05, label: 'Greeting' },
  { at: 0.25, label: 'Discovery' },
  { at: 0.45, label: 'Qualification' },
  { at: 0.65, label: 'Objections' },
  { at: 0.88, label: 'Closing' },
];

let counter = 0;
const uid = () => `vt-${Date.now().toString(36)}-${counter++}`;

// Feature 8 — an interactive, clickable event timeline.
export function buildSpeechTimeline(parts: TimelineParts): VoiceTimelineEvent[] {
  const { input, confidence, fillers, silence, interruptions, toneEnergy } = parts;
  const dur = Math.max(input.durationSeconds, 30);
  const ev: VoiceTimelineEvent[] = [];
  const add = (atSec: number, kind: VoiceTimelineEvent['kind'], label: string, detail: string, score?: number) =>
    ev.push({ id: uid(), atSec: Math.round(atSec), time: fmtTime(atSec), kind, label, detail, score });

  PHASES.forEach((p) => add(dur * p.at, 'phase', p.label, `${p.label} phase of the conversation.`));

  // Confidence moments
  if (confidence.confidence >= 75) add(dur * 0.3, 'high_confidence', 'High confidence', 'Strong, assured delivery here.', confidence.confidence);
  else add(dur * 0.3, 'low_confidence', 'Low confidence', 'Hesitation detected — steady your delivery.', confidence.confidence);

  // Filler cluster
  if (fillers.timeline.length) {
    const worst = fillers.timeline[Math.floor(fillers.timeline.length / 2)];
    add(worst.atSec, 'missed_opportunity', 'Filler words', `Cluster of filler words around here ("${worst.word}").`);
  }

  // Long pause / dead air
  if (silence.longPauses > 0) add(dur * 0.55, 'pause', 'Long pause', `${silence.longPauses} long pause(s); ~${silence.deadAirSec}s dead air.`);

  // Interruptions
  if (interruptions.totalInterruptions > 0) add(dur * 0.68, 'interruption', 'Interruption', `${interruptions.totalInterruptions} overlap(s) detected.`);

  // Empathy moment
  if (toneEnergy.empathetic >= 65) add(dur * 0.5, 'empathy', 'Empathy moment', 'You acknowledged the customer well here.', toneEnergy.empathetic);

  // Closing recommendation
  add(dur * 0.95, 'recommendation', 'Wrap-up', 'Confirm next steps clearly to close strong.');

  return ev.sort((a, b) => a.atSec - b.atSec);
}
