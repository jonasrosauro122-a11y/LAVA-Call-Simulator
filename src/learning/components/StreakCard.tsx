import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface StreakCardProps {
  current: number;
  longest: number;
}

export function StreakCard({ current, longest }: StreakCardProps) {
  const active = current > 0;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <motion.div
          animate={active ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 1.4, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
            active ? 'gradient-lava text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-400'
          }`}
        >
          <Flame size={26} />
        </motion.div>
        <div className="flex-1">
          <p className="text-xs text-ink-500 dark:text-ink-400">Current streak</p>
          <p className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">
            {current} <span className="text-sm font-normal text-ink-400">day{current === 1 ? '' : 's'}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-500 dark:text-ink-400">Longest</p>
          <p className="font-display text-lg font-bold text-ink-700 dark:text-ink-200">{longest}</p>
        </div>
      </div>
      {active ? (
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-3">Complete an activity today to keep it going.</p>
      ) : (
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-3">Do one activity today to start a streak.</p>
      )}
    </Card>
  );
}
