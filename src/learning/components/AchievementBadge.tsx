import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { iconByName } from './icons';
import type { AchievementView } from '../lib/achievements';

interface AchievementBadgeProps {
  view: AchievementView;
  index?: number;
}

export function AchievementBadge({ view, index = 0 }: AchievementBadgeProps) {
  const { def, current, target, unlocked, progressPct } = view;
  const Icon = iconByName(def.icon);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className={`card p-4 flex flex-col items-center text-center ${unlocked ? '' : 'opacity-80'}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
        unlocked ? 'gradient-lava text-white shadow-soft' : 'bg-ink-100 dark:bg-ink-800 text-ink-400'
      }`}>
        {unlocked ? <Icon size={26} /> : <Lock size={22} />}
      </div>
      <h4 className="font-semibold text-sm text-ink-800 dark:text-ink-100">{def.title}</h4>
      <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 flex-1">{def.description}</p>

      {unlocked ? (
        <span className="badge bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400 mt-3">+{def.xpReward} XP</span>
      ) : (
        <div className="w-full mt-3">
          <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
            <div className="h-full rounded-full gradient-lava" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[11px] text-ink-400 mt-1">{current}/{target}</p>
        </div>
      )}
    </motion.div>
  );
}
