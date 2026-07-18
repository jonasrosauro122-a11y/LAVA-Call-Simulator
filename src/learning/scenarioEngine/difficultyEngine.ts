import type { ScenarioDifficulty } from './types';

export const DIFFICULTIES: ScenarioDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

export interface DifficultyDirectives {
  level: ScenarioDifficulty;
  objectionFrequency: number; // 0-1
  giveHints: boolean;
  responseComplexity: 'low' | 'medium' | 'high';
  note: string;
}

function indexOf(level: ScenarioDifficulty): number {
  return Math.max(0, DIFFICULTIES.indexOf(level));
}

export function directivesFor(level: ScenarioDifficulty): DifficultyDirectives {
  const i = indexOf(level);
  return {
    level,
    objectionFrequency: [0.1, 0.25, 0.45, 0.65, 0.85][i],
    giveHints: i <= 1,
    responseComplexity: i <= 1 ? 'low' : i <= 2 ? 'medium' : 'high',
    note: i <= 1 ? 'Supportive: simpler responses, occasional hints.' : i >= 3 ? 'Challenging: frequent objections, higher complexity.' : 'Balanced difficulty.',
  };
}

// Feature 6 — adapt difficulty mid-conversation from a rolling performance signal.
// performance: 0-100 (recent learner quality). Returns the adjusted level.
export function adapt(level: ScenarioDifficulty, performance: number): ScenarioDifficulty {
  const i = indexOf(level);
  if (performance >= 80 && i < DIFFICULTIES.length - 1) return DIFFICULTIES[i + 1];
  if (performance < 45 && i > 0) return DIFFICULTIES[i - 1];
  return level;
}
