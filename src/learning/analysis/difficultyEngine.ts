import type { DifficultyLevel, DifficultyState } from './types';

const LEVELS: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

export interface DifficultyInput {
  avgQuiz: number; // 0-100
  avgSim: number; // 0-100
  modulesCompleted: number;
  trendSlope: number; // positive = improving
}

// Feature 8: difficulty derived from quiz scores, simulation scores, progress, and trend.
export function computeDifficulty(input: DifficultyInput): DifficultyState {
  const progressScore = Math.min(input.modulesCompleted, 12) / 12 * 100;
  const trendBoost = Math.max(-10, Math.min(10, input.trendSlope * 5));
  const composite = input.avgSim * 0.4 + input.avgQuiz * 0.3 + progressScore * 0.2 + 50 * 0.1 + trendBoost;

  let index: number;
  if (composite < 45) index = 0;
  else if (composite < 60) index = 1;
  else if (composite < 75) index = 2;
  else if (composite < 88) index = 3;
  else index = 4;

  const level = LEVELS[index];
  const nextLevel = index < 4 ? LEVELS[index + 1] : null;
  const rationale =
    input.avgSim === 0 && input.avgQuiz === 0
      ? 'Starting at Beginner until you complete a few activities.'
      : `Based on your ${Math.round(input.avgSim)} avg simulation, ${Math.round(input.avgQuiz)} avg quiz, and ${input.modulesCompleted} modules completed.`;

  return { level, index, rationale, nextLevel };
}

export const DIFFICULTY_LEVELS = LEVELS;
