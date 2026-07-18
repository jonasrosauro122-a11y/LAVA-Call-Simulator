import type { LearningPath } from '../types/learning';
import { computePathProgress, type ProgressInput } from './progressEngine';

// Overall path score = average of each module's simulation and quiz scores.
export function pathScore(path: LearningPath, input: ProgressInput): number {
  const parts: number[] = [];
  for (const m of path.modules) {
    const sim = input.simScores[m.id];
    const quiz = input.quizScores[m.quiz.id];
    if (sim != null) parts.push(sim);
    if (quiz != null) parts.push(quiz);
  }
  if (!parts.length) return 0;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function isEligibleForCertificate(path: LearningPath, input: ProgressInput): boolean {
  return computePathProgress(path, input).complete;
}
