import { createRng } from '../../learning/scenarioEngine/rng';
import type { LearnerSummary, Cohort } from '../types';

const NAMES = [
  'Maria Santos', 'James Chen', 'Aisha Khan', 'Diego Ramirez', 'Grace Okafor',
  'Liam Murphy', 'Priya Patel', 'Noah Williams', 'Sofia Rossi', 'Kenji Tanaka',
  'Fatima Al-Sayed', 'Ethan Brooks', 'Ana Beltran', 'Marcus Lee',
];
const DEPARTMENTS = ['Insurance CSR', 'Cold Calling', 'Medical VA', 'Customer Support'];
const PATHS = ['Insurance CSR Mastery', 'Cold Calling Pro', 'Medical VA Essentials', 'Customer Support Excellence', 'General English'];

export const DEMO_COHORTS: Cohort[] = [
  { id: 'cohort-a', name: 'Insurance Batch A', kind: 'batch', trainerId: 'me', memberIds: [], createdAt: '2026-06-01T00:00:00Z' },
  { id: 'cohort-b', name: 'Cold Calling Bootcamp', kind: 'class', trainerId: 'me', memberIds: [], createdAt: '2026-06-15T00:00:00Z' },
  { id: 'cohort-c', name: 'Medical VA Group', kind: 'group', trainerId: 'me', memberIds: [], createdAt: '2026-07-01T00:00:00Z' },
];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/(^\.|\.$)/g, '');
}

// Deterministic demo learners so management views are populated without real
// multi-user data (mirrors the Stage 3 leaderboard "demo + me" approach).
export function buildDemoRoster(): LearnerSummary[] {
  return NAMES.map((name, i) => {
    const rng = createRng(1000 + i * 7);
    const avgScore = rng.int(48, 95);
    const voiceScore = rng.int(45, 94);
    const confidence = rng.int(40, 96);
    const progressPct = rng.int(10, 100);
    const streak = rng.int(0, 45);
    const cohortId = DEMO_COHORTS[i % DEMO_COHORTS.length].id;
    const atRisk = avgScore < 60 || progressPct < 25 || confidence < 50;
    return {
      id: `learner-${i + 1}`,
      name,
      email: `${slug(name)}@acme-training.com`,
      avatarSeed: name,
      cohortId,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      enrolledPaths: rng.int(1, 4),
      activePathTitle: PATHS[i % PATHS.length],
      progressPct,
      avgScore,
      simulations: rng.int(2, 40),
      communicationScore: rng.int(45, 95),
      voiceScore,
      confidence,
      xp: rng.int(200, 14000),
      level: rng.int(1, 16),
      streak,
      certificates: rng.int(0, 5),
      achievements: rng.int(1, 17),
      attendancePct: rng.int(60, 100),
      lastActiveDaysAgo: rng.int(0, 14),
      atRisk,
      trend: rng.int(-18, 28),
      isCurrentUser: false,
    };
  });
}

export function assignCohortMembers(roster: LearnerSummary[]): Cohort[] {
  return DEMO_COHORTS.map((c) => ({ ...c, memberIds: roster.filter((l) => l.cohortId === c.id).map((l) => l.id) }));
}

export interface CurrentUserInput {
  id: string;
  name: string;
  avgScore: number;
  communicationScore: number;
  voiceScore: number;
  confidence: number;
  progressPct: number;
  simulations: number;
  enrolledPaths: number;
  activePathTitle: string;
  xp: number;
  level: number;
  streak: number;
  certificates: number;
  achievements: number;
}

export function buildCurrentUserLearner(input: CurrentUserInput): LearnerSummary {
  return {
    id: input.id,
    name: input.name || 'You',
    email: 'you@acme-training.com',
    avatarSeed: input.name || 'You',
    cohortId: 'cohort-a',
    department: 'Insurance CSR',
    enrolledPaths: input.enrolledPaths,
    activePathTitle: input.activePathTitle || 'General English',
    progressPct: input.progressPct,
    avgScore: input.avgScore,
    simulations: input.simulations,
    communicationScore: input.communicationScore,
    voiceScore: input.voiceScore,
    confidence: input.confidence,
    xp: input.xp,
    level: input.level,
    streak: input.streak,
    certificates: input.certificates,
    achievements: input.achievements,
    attendancePct: 100,
    lastActiveDaysAgo: 0,
    atRisk: input.avgScore > 0 && input.avgScore < 60,
    trend: 0,
    isCurrentUser: true,
  };
}
