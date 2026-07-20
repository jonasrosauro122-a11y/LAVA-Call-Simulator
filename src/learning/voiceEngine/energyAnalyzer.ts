import type { VoiceInput } from './types';
import { clamp } from './extract';
import { effectiveWpm } from './paceAnalyzer';

// Energy dimensions derived from pace and category energy.
export function analyzeEnergy(input: VoiceInput): { energetic: number; passive: number; monotone: number } {
  const wpm = effectiveWpm(input);
  const energyBase = input.categoryScores['Energy Level'] ?? input.categoryScores['Confidence'] ?? input.overallScore;
  const paceEnergy = clamp(50 + (wpm - 130) * 0.6);
  const energetic = clamp((energyBase + paceEnergy) / 2);
  return {
    energetic,
    passive: clamp(100 - energetic),
    monotone: clamp(100 - (input.categoryScores['Tone'] ?? energyBase)),
  };
}
