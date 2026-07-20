import type { XpReason } from '../types/learning';

// XP awarded for each learning action.
export const XP_AWARDS: Record<XpReason, number> = {
  lesson_complete: 20,
  quiz_pass: 40,
  quiz_perfect: 25, // bonus on top of quiz_pass
  simulation_pass: 60,
  module_complete: 50,
  path_complete: 200,
  daily_streak: 15,
  achievement: 0, // amount supplied per-achievement via override
  daily_challenge: 0, // amount supplied per-challenge via override
  weekly_goal: 0, // amount supplied per-goal via override
};

export function xpFor(reason: XpReason): number {
  return XP_AWARDS[reason] ?? 0;
}

// XP required to advance FROM level L to L+1. Grows linearly so early levels
// come quickly and later levels take sustained practice.
export function xpToAdvance(level: number): number {
  return 100 + (level - 1) * 50;
}

// Cumulative XP required to REACH a given level (level 1 == 0 xp).
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToAdvance(l);
  return total;
}

export interface LevelInfo {
  level: number;
  intoLevelXp: number; // xp earned within the current level
  neededForNext: number; // xp span of the current level
  pct: number; // 0-100 progress toward next level
  totalXp: number;
}

export function levelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xp >= cumulativeXpForLevel(level + 1)) level++;
  const base = cumulativeXpForLevel(level);
  const neededForNext = xpToAdvance(level);
  const intoLevelXp = xp - base;
  const pct = Math.min(100, Math.round((intoLevelXp / neededForNext) * 100));
  return { level, intoLevelXp, neededForNext, pct, totalXp: xp };
}

export function levelFromXp(totalXp: number): number {
  return levelInfo(totalXp).level;
}

// A friendly rank title for a level, purely cosmetic.
export function levelTitle(level: number): string {
  if (level >= 20) return 'Master Communicator';
  if (level >= 15) return 'Expert';
  if (level >= 10) return 'Advanced';
  if (level >= 6) return 'Proficient';
  if (level >= 3) return 'Developing';
  return 'Beginner';
}
