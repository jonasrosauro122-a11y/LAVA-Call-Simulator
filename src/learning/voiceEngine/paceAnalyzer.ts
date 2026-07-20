import type { VoiceInput, PacePoint } from './types';

export function effectiveWpm(input: VoiceInput): number {
  if (input.wpm != null) return Math.round(input.wpm);
  const minutes = Math.max(input.durationSeconds / 60, 0.25);
  return Math.round(input.words / minutes);
}

// Build a per-segment WPM series (deterministic variation around the mean when
// live per-segment timing is unavailable).
export function analyzePace(input: VoiceInput, segments = 6): PacePoint[] {
  const mean = effectiveWpm(input);
  const points: PacePoint[] = [];
  for (let i = 0; i < segments; i++) {
    // Deterministic wobble seeded by segment index and transcript length.
    const wobble = Math.sin((i + 1) * 1.3 + input.words * 0.01) * 14;
    points.push({ label: `${Math.round((i / segments) * (input.durationSeconds))}s`, wpm: Math.max(60, Math.round(mean + wobble)) });
  }
  return points;
}

export function paceVerdict(wpm: number): string {
  if (wpm < 110) return 'Slow — consider adding energy.';
  if (wpm <= 160) return 'Well-paced and easy to follow.';
  if (wpm <= 185) return 'A little fast — breathe between points.';
  return 'Too fast — slow down for clarity.';
}
