import type { VoiceInput, SilenceReport, FillerReport } from './types';
import { effectiveWpm } from './paceAnalyzer';

// Feature 4 — silence/pause estimation. Slower speech + more fillers imply more
// pausing; deterministic when precise VAD timing is unavailable.
export function analyzeSilence(input: VoiceInput, fillers: FillerReport): SilenceReport {
  const wpm = effectiveWpm(input);
  const slowFactor = Math.max(0, (150 - wpm) / 150); // 0 when fast, up to ~1 when slow
  const dur = input.durationSeconds;

  const naturalPauses = Math.round(input.words / 45) + 2;
  const longPauses = Math.round(slowFactor * 4 + fillers.perMinute * 0.3);
  const deadAirSec = Math.round(slowFactor * dur * 0.08);
  const thinkingTimeSec = Math.round(Math.min(dur * 0.15, naturalPauses * 1.5));

  return {
    deadAirSec,
    longPauses,
    naturalPauses,
    thinkingTimeSec,
    customerWaitingSec: Math.round(deadAirSec * 0.6),
    aiWaitingSec: Math.round(deadAirSec * 0.4),
  };
}
