import { Award, Flame, Mic2 } from 'lucide-react';
import { Avatar } from './Avatar';
import type { LeaderEntry } from '../lib/leaderboard';

interface LeaderboardTableProps {
  entries: LeaderEntry[];
}

function medal(rank: number): string {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div
          key={e.id}
          className={`flex items-center gap-3 p-3 rounded-xl border ${
            e.isMe
              ? 'border-lava-300 dark:border-lava-800 bg-lava-50/60 dark:bg-lava-950/30'
              : 'border-transparent bg-ink-50 dark:bg-ink-800/40'
          }`}
        >
          <span className="w-8 text-center font-display font-bold text-ink-600 dark:text-ink-300 shrink-0">{medal(e.rank ?? 0)}</span>
          <Avatar name={e.name} size={38} highlight={e.isMe} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-ink-800 dark:text-ink-100 truncate">
              {e.name}{e.isMe && <span className="text-lava-700 dark:text-lava-400"> (you)</span>}
            </p>
            <div className="flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
              <span className="flex items-center gap-1"><Award size={11} /> {e.certificates}</span>
              <span className="flex items-center gap-1"><Flame size={11} /> {e.streak}</span>
              <span className="flex items-center gap-1"><Mic2 size={11} /> {e.sims}</span>
            </div>
          </div>
          <span className="font-display font-bold text-ink-800 dark:text-ink-100 shrink-0">{e.xp.toLocaleString()} <span className="text-xs font-normal text-ink-400">XP</span></span>
        </div>
      ))}
    </div>
  );
}
