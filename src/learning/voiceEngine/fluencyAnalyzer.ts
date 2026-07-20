import type { VoiceInput } from './types';
import { clamp } from './extract';
import type { FillerReport } from './types';

// Fluency blends category fluency, filler frequency, and pace steadiness.
export function analyzeFluency(input: VoiceInput, fillers: FillerReport): number {
  const base = input.categoryScores['Fluency'] ?? input.categoryScores['Communication'] ?? input.overallScore;
  const fillerPenalty = Math.min(30, fillers.perMinute * 3);
  return clamp(base - fillerPenalty * 0.5);
}
