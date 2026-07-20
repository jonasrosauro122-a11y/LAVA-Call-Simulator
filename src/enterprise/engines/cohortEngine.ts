import type { Cohort, CohortStats, LearnerSummary } from '../types';

const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

// Cohort Engine — aggregates and compares cohort performance.
export function computeCohortStats(cohort: Cohort, roster: LearnerSummary[]): CohortStats {
  const learners = roster.filter((l) => cohort.memberIds.includes(l.id));
  return {
    cohort,
    learners: learners.length,
    avgScore: avg(learners.map((l) => l.avgScore)),
    avgVoiceScore: avg(learners.map((l) => l.voiceScore)),
    avgProgress: avg(learners.map((l) => l.progressPct)),
    completionRate: learners.length ? Math.round((learners.filter((l) => l.progressPct >= 100).length / learners.length) * 100) : 0,
    atRisk: learners.filter((l) => l.atRisk).length,
  };
}

export function compareCohorts(cohorts: Cohort[], roster: LearnerSummary[]): CohortStats[] {
  return cohorts.map((c) => computeCohortStats(c, roster)).sort((a, b) => b.avgScore - a.avgScore);
}

export function createCohort(name: string, kind: Cohort['kind'], trainerId: string, memberIds: string[] = []): Cohort {
  return { id: `cohort-${Date.now().toString(36)}`, name, kind, trainerId, memberIds, createdAt: new Date().toISOString() };
}
