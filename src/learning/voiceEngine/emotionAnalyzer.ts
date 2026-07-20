import type { VoiceInput } from './types';

// Derives a dominant emotion label from the emotion timeline (if present) or the
// category profile.
export function analyzeEmotion(input: VoiceInput): string {
  const last = input.emotionTimeline[input.emotionTimeline.length - 1];
  if (last && typeof last === 'object' && last !== null && 'emotion' in last) {
    const e = (last as { emotion?: unknown }).emotion;
    if (typeof e === 'string') return e;
  }
  const empathy = input.categoryScores['Empathy'] ?? 50;
  const confidence = input.categoryScores['Confidence'] ?? 50;
  if (confidence >= 75 && empathy >= 70) return 'Warm & Assured';
  if (confidence < 45) return 'Tentative';
  if (empathy >= 70) return 'Empathetic';
  return 'Neutral';
}
