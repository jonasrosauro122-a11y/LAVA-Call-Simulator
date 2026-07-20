export type LeaderScope = 'weekly' | 'monthly' | 'all';

export interface LeaderEntry {
  id: string;
  name: string;
  avatarSeed: string;
  xp: number;
  certificates: number;
  streak: number;
  sims: number;
  isMe?: boolean;
  rank?: number;
}

export interface MeStats {
  name: string;
  weekly: number;
  monthly: number;
  all: number;
  certificates: number;
  streak: number;
  sims: number;
}

// Demo cohort. Clearly abstracted so a real backend feed can replace it later
// (e.g. per-company). Each entry carries XP for all three scopes.
interface DemoRow { name: string; all: number; monthly: number; weekly: number; certificates: number; streak: number; sims: number; }
const DEMO: DemoRow[] = [
  { name: 'Maria Santos', all: 8420, monthly: 1890, weekly: 620, certificates: 4, streak: 22, sims: 41 },
  { name: 'James Okoro', all: 7310, monthly: 1620, weekly: 540, certificates: 3, streak: 15, sims: 36 },
  { name: 'Priya Natarajan', all: 6980, monthly: 1450, weekly: 705, certificates: 3, streak: 31, sims: 33 },
  { name: 'Diego Alvarez', all: 5640, monthly: 1210, weekly: 480, certificates: 2, streak: 9, sims: 28 },
  { name: 'Anna Kowalski', all: 4890, monthly: 980, weekly: 390, certificates: 2, streak: 12, sims: 24 },
  { name: 'Chen Wei', all: 4120, monthly: 1340, weekly: 610, certificates: 2, streak: 18, sims: 21 },
  { name: 'Fatima Al-Rashid', all: 3550, monthly: 760, weekly: 300, certificates: 1, streak: 7, sims: 19 },
  { name: 'Liam Murphy', all: 2980, monthly: 640, weekly: 260, certificates: 1, streak: 4, sims: 16 },
  { name: 'Sofia Rossi', all: 2210, monthly: 520, weekly: 210, certificates: 1, streak: 6, sims: 12 },
  { name: 'Tunde Bello', all: 1740, monthly: 410, weekly: 180, certificates: 0, streak: 3, sims: 9 },
];

function scopeValue(row: DemoRow, scope: LeaderScope): number {
  return scope === 'weekly' ? row.weekly : scope === 'monthly' ? row.monthly : row.all;
}

export function buildLeaderboard(scope: LeaderScope, me: MeStats): LeaderEntry[] {
  const entries: LeaderEntry[] = DEMO.map((r, i) => ({
    id: `demo-${i}`,
    name: r.name,
    avatarSeed: r.name,
    xp: scopeValue(r, scope),
    certificates: r.certificates,
    streak: r.streak,
    sims: r.sims,
  }));

  entries.push({
    id: 'me',
    name: me.name || 'You',
    avatarSeed: me.name || 'You',
    xp: scope === 'weekly' ? me.weekly : scope === 'monthly' ? me.monthly : me.all,
    certificates: me.certificates,
    streak: me.streak,
    sims: me.sims,
    isMe: true,
  });

  entries.sort((a, b) => b.xp - a.xp);
  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

export function myRank(scope: LeaderScope, me: MeStats): number {
  return buildLeaderboard(scope, me).find((e) => e.isMe)?.rank ?? 0;
}
