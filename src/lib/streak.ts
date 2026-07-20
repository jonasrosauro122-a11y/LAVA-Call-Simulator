import type { StreakRow } from '../types/learning';

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parse(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function dayDiff(from: string, to: string): number {
  return Math.round((parse(to) - parse(from)) / 86400000);
}

// Streak shown to the user: 0 if the last activity is older than yesterday.
export function effectiveCurrent(row: StreakRow, today = todayKey()): number {
  if (!row.last_active) return 0;
  const diff = dayDiff(row.last_active, today);
  if (diff <= 1) return row.current_streak; // today or yesterday keeps the streak alive
  return 0;
}

export interface StreakUpdate {
  current_streak: number;
  longest_streak: number;
  last_active: string;
  increased: boolean;
}

// Apply one activity performed "today".
export function applyActivity(row: StreakRow, today = todayKey()): StreakUpdate {
  if (row.last_active === today) {
    return { current_streak: row.current_streak, longest_streak: row.longest_streak, last_active: today, increased: false };
  }
  const diff = row.last_active ? dayDiff(row.last_active, today) : Infinity;
  const current = diff === 1 ? row.current_streak + 1 : 1;
  const longest = Math.max(row.longest_streak, current);
  return { current_streak: current, longest_streak: longest, last_active: today, increased: true };
}
