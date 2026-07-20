import type { VoiceInput, ToneEnergyReport } from './types';
import { clamp } from './extract';
import { analyzeEnergy } from './energyAnalyzer';
import { analyzeEmotion } from './emotionAnalyzer';

// Feature 7 — assembles the full tone & energy report from category signals.
export function analyzeToneEnergy(input: VoiceInput): ToneEnergyReport {
  const cs = input.categoryScores;
  const g = (k: string, fallback = input.overallScore) => clamp(cs[k] ?? fallback);
  const energy = analyzeEnergy(input);

  return {
    friendly: clamp((g('Empathy') + g('Tone')) / 2),
    professional: g('Professionalism'),
    calm: clamp((g('Confidence') + g('Tone')) / 2),
    confident: g('Confidence'),
    empathetic: g('Empathy'),
    assertive: clamp((g('Confidence') + g('Persuasion', g('Confidence'))) / 2),
    monotone: energy.monotone,
    energetic: energy.energetic,
    passive: energy.passive,
    dominantEmotion: analyzeEmotion(input),
  };
}
