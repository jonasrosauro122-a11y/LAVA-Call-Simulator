import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { levelTitle, type LevelInfo } from '../lib/xpEngine';

interface XpBarProps {
  level: LevelInfo;
  compact?: boolean;
}

// Horizontal level + XP bar. Uses the existing lava palette and display font.
export function XpBar({ level, compact }: XpBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg gradient-lava text-white flex items-center justify-center font-display font-bold text-sm shadow-soft">
            {level.level}
          </span>
          <div className="leading-tight">
            <p className="font-display font-bold text-ink-800 dark:text-ink-100 text-sm">Level {level.level}</p>
            {!compact && (
              <p className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-1">
                <Star size={11} className="text-lava-600" /> {levelTitle(level.level)}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-ink-500 dark:text-ink-400 font-mono">
          {level.intoLevelXp}/{level.neededForNext} XP
        </p>
      </div>
      <div className="h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full gradient-lava"
          initial={{ width: 0 }}
          animate={{ width: `${level.pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
