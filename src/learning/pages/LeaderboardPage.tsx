import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Info } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { Card } from '../../components/ui/Card';
import { useGamification } from '../context/GamificationContext';
import type { LeaderScope } from '../lib/leaderboard';

const TABS: { id: LeaderScope; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'all', label: 'All-Time' },
];

export function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderScope>('weekly');
  const { leaderboard, myLeaderboardRank } = useGamification();
  const entries = leaderboard(scope);

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Back to Learning', to: '/learning' }} />
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1">
            <Trophy size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Leaderboard</span>
          </div>
          <h1 className="section-title text-3xl">You're #{myLeaderboardRank(scope)} {scope === 'all' ? 'all-time' : `this ${scope === 'weekly' ? 'week' : 'month'}`}</h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setScope(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                scope === t.id ? 'bg-lava-700 text-white shadow-soft' : 'bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card className="p-4">
          <LeaderboardTable entries={entries} />
        </Card>

        <p className="text-xs text-ink-400 flex items-center gap-1.5">
          <Info size={12} /> Cohort shown with demo learners; your live stats are ranked among them. Ready for per-company data.
        </p>
      </main>
    </div>
  );
}
