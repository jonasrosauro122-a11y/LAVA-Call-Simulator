export interface Rank {
  index: number;
  name: string;
  minXp: number;
  nextXp: number | null;
  color: string; // hex, aligned with the lava/ink palette accents
  icon: string; // lucide icon name
}

// 11 ranks driven purely by cumulative XP.
const RANK_TABLE: { name: string; minXp: number; color: string; icon: string }[] = [
  { name: 'Recruit', minXp: 0, color: '#8a8a8a', icon: 'Sprout' },
  { name: 'Trainee', minXp: 250, color: '#6b7280', icon: 'GraduationCap' },
  { name: 'Associate', minXp: 600, color: '#0ea5e9', icon: 'UserCheck' },
  { name: 'Professional', minXp: 1100, color: '#2563eb', icon: 'Briefcase' },
  { name: 'Specialist', minXp: 1800, color: '#7c3aed', icon: 'Target' },
  { name: 'Expert', minXp: 2800, color: '#9333ea', icon: 'Star' },
  { name: 'Senior Expert', minXp: 4200, color: '#c026d3', icon: 'Award' },
  { name: 'Master', minXp: 6000, color: '#db2777', icon: 'Medal' },
  { name: 'Elite', minXp: 8500, color: '#b71c1c', icon: 'Flame' },
  { name: 'Legend', minXp: 12000, color: '#8B0000', icon: 'Crown' },
  { name: 'Grandmaster', minXp: 17000, color: '#f59e0b', icon: 'Trophy' },
];

export function getRank(xp: number): Rank {
  const total = Math.max(0, xp);
  let index = 0;
  for (let i = 0; i < RANK_TABLE.length; i++) {
    if (total >= RANK_TABLE[i].minXp) index = i;
  }
  const cur = RANK_TABLE[index];
  const next = RANK_TABLE[index + 1] ?? null;
  return {
    index,
    name: cur.name,
    minXp: cur.minXp,
    nextXp: next ? next.minXp : null,
    color: cur.color,
    icon: cur.icon,
  };
}

export function rankProgress(xp: number): number {
  const r = getRank(xp);
  if (r.nextXp == null) return 100;
  return Math.round(((xp - r.minXp) / (r.nextXp - r.minXp)) * 100);
}

export const ALL_RANKS = RANK_TABLE.map((r, i) => ({ ...r, index: i }));
