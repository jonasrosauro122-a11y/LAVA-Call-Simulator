import { createRng } from '../../learning/scenarioEngine/rng';
import type { Assignment, AssignmentType, AssignmentWithProgress, LearnerSummary, Cohort, Priority, Difficulty } from '../types';

const TEMPLATES: { title: string; type: AssignmentType; targetId: string; difficulty: Difficulty }[] = [
  { title: 'Complete Insurance CSR Path', type: 'path', targetId: 'insurance-csr', difficulty: 'Intermediate' },
  { title: 'Objection Handling Simulation', type: 'simulation', targetId: '4', difficulty: 'Advanced' },
  { title: 'Pronunciation & Clarity Module', type: 'module', targetId: 'english-m2', difficulty: 'Beginner' },
  { title: 'Grammar Essentials Quiz', type: 'quiz', targetId: 'english-m1', difficulty: 'Beginner' },
  { title: 'Voice Practice: Reduce Fillers', type: 'voice', targetId: 'voice-fillers', difficulty: 'Intermediate' },
];

function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86400000).toISOString();
}

// Assignment Engine — creates assignments and computes their completion.
export function createAssignment(input: {
  title: string; type: AssignmentType; targetId: string; assignerId: string;
  learnerIds: string[]; cohortId?: string | null; dueInDays: number; priority: Priority; difficulty: Difficulty;
}): Assignment {
  return {
    id: `asg-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`,
    title: input.title, type: input.type, targetId: input.targetId, assignerId: input.assignerId,
    learnerIds: input.learnerIds, cohortId: input.cohortId ?? null,
    dueAt: daysFromNow(input.dueInDays), priority: input.priority, difficulty: input.difficulty,
    createdAt: new Date().toISOString(),
  };
}

export function buildDemoAssignments(roster: LearnerSummary[], cohorts: Cohort[]): Assignment[] {
  const priorities: Priority[] = ['low', 'medium', 'high'];
  return TEMPLATES.map((t, i) => {
    const rng = createRng(500 + i * 11);
    const cohort = cohorts[i % cohorts.length];
    return {
      id: `asg-demo-${i + 1}`,
      title: t.title, type: t.type, targetId: t.targetId, assignerId: 'me',
      learnerIds: cohort ? cohort.memberIds : roster.slice(0, 5).map((l) => l.id),
      cohortId: cohort?.id ?? null,
      dueAt: daysFromNow(rng.int(-3, 14)),
      priority: priorities[rng.int(0, 2)],
      difficulty: t.difficulty,
      createdAt: daysFromNow(-rng.int(1, 20)),
    };
  });
}

// Deterministic completion for a learner (derived from their overall progress).
function completionFor(learner: LearnerSummary | undefined, assignment: Assignment): number {
  if (!learner) return 0;
  const rng = createRng((learner.id.length * 31 + assignment.id.length * 17) >>> 0);
  const base = Math.round(learner.progressPct * 0.6 + rng.int(0, 40));
  return Math.max(0, Math.min(100, base));
}

export function computeAssignmentProgress(assignment: Assignment, roster: LearnerSummary[]): AssignmentWithProgress {
  const total = assignment.learnerIds.length || 1;
  const completions = assignment.learnerIds.map((id) => completionFor(roster.find((l) => l.id === id), assignment));
  const completed = completions.filter((c) => c >= 100).length;
  const completionRate = Math.round(completions.reduce((a, b) => a + b, 0) / total);
  return {
    assignment,
    completionRate,
    completed,
    total,
    overdue: new Date(assignment.dueAt).getTime() < Date.now() && completed < total,
  };
}

export function learnerCompletion(assignment: Assignment, learner: LearnerSummary): number {
  return completionFor(learner, assignment);
}
