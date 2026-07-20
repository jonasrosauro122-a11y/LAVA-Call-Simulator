export interface PeriodCounts {
  lessons: number;
  quizzes: number;
  sims: number;
  xp: number;
  modules: number;
}

export interface Challenge {
  id: string;
  title: string;
  metric: keyof PeriodCounts;
  target: number;
  reward: number;
}

export interface ChallengeView {
  challenge: Challenge;
  current: number;
  target: number;
  complete: boolean;
  claimed: boolean;
}

export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function weekKey(d = new Date()): string {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const jan1 = new Date(start.getFullYear(), 0, 1);
  const week = Math.ceil(((start.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${start.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

const DAILY_POOL: Omit<Challenge, 'id'>[] = [
  { title: 'Complete one lesson', metric: 'lessons', target: 1, reward: 15 },
  { title: 'Finish one quiz', metric: 'quizzes', target: 1, reward: 20 },
  { title: 'Complete one simulation', metric: 'sims', target: 1, reward: 30 },
  { title: 'Earn 150 XP today', metric: 'xp', target: 150, reward: 25 },
  { title: 'Complete two lessons', metric: 'lessons', target: 2, reward: 25 },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

// Deterministic 3 challenges per day.
export function buildDailyChallenges(d = new Date()): Challenge[] {
  const key = dateKey(d);
  const seed = hashStr(key);
  const picks: Challenge[] = [];
  const used = new Set<number>();
  let i = 0;
  while (picks.length < 3 && used.size < DAILY_POOL.length) {
    const idx = (seed + i * 7) % DAILY_POOL.length;
    i++;
    if (used.has(idx)) continue;
    used.add(idx);
    picks.push({ ...DAILY_POOL[idx], id: `daily-${key}-${idx}` });
  }
  return picks;
}

export function buildWeeklyGoals(d = new Date()): Challenge[] {
  const key = weekKey(d);
  return [
    { id: `weekly-${key}-lessons3`, title: 'Complete 3 lessons', metric: 'lessons', target: 3, reward: 60 },
    { id: `weekly-${key}-sims2`, title: 'Complete 2 simulations', metric: 'sims', target: 2, reward: 80 },
    { id: `weekly-${key}-xp500`, title: 'Earn 500 XP', metric: 'xp', target: 500, reward: 75 },
    { id: `weekly-${key}-module1`, title: 'Finish 1 module', metric: 'modules', target: 1, reward: 50 },
  ];
}

export function evaluateChallenges(
  challenges: Challenge[],
  counts: PeriodCounts,
  claimed: Set<string>,
): ChallengeView[] {
  return challenges.map((c) => {
    const current = Math.min(counts[c.metric], c.target);
    return { challenge: c, current, target: c.target, complete: current >= c.target, claimed: claimed.has(c.id) };
  });
}
