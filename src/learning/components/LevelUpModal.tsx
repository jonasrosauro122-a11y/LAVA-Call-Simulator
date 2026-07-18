import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RankBadge } from './RankBadge';
import { useGamification } from '../context/GamificationContext';
import { useLearning } from '../context/LearningContext';
import { getRank } from '../lib/rankEngine';
import { cumulativeXpForLevel } from '../lib/xpEngine';

export function LevelUpModal() {
  const { levelUp, dismissLevelUp, rank } = useGamification();
  const { level } = useLearning();

  const prevRank = levelUp ? getRank(cumulativeXpForLevel(levelUp.from)) : null;
  const rankChanged = prevRank && prevRank.name !== rank.name;

  return (
    <AnimatePresence>
      {levelUp && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={dismissLevelUp}
        >
          <motion.div
            className="card-elevated max-w-sm w-full p-8 text-center relative overflow-hidden"
            initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={dismissLevelUp} className="absolute top-3 right-3 btn-ghost p-1.5" aria-label="Close">
              <X size={18} />
            </button>
            {/* Celebratory dots */}
            {[...Array(10)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-2 h-2 rounded-full gradient-lava"
                style={{ left: `${10 + i * 8}%`, top: '20%' }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: [0, -30, 120], opacity: [1, 1, 0] }}
                transition={{ duration: 1.6, delay: i * 0.05, ease: 'easeOut' }}
              />
            ))}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl gradient-lava flex items-center justify-center mx-auto mb-4 shadow-elevated">
                <Sparkles size={30} className="text-white" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-lava-700 dark:text-lava-400">Level Up!</p>
              <div className="flex items-center justify-center gap-3 my-3">
                <span className="font-display text-2xl font-bold text-ink-400">{levelUp.from}</span>
                <ArrowRight size={20} className="text-lava-600" />
                <span className="font-display text-4xl font-bold text-gradient-lava">{levelUp.to}</span>
              </div>
              {rankChanged && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-sm text-ink-500 dark:text-ink-400">New rank:</span>
                  <RankBadge rank={rank} size="sm" />
                </div>
              )}
              <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-3 text-sm text-ink-600 dark:text-ink-300 mb-5">
                Next goal: reach Level {level.level + 1} — {level.neededForNext - level.intoLevelXp} XP to go.
              </div>
              <Button className="w-full" onClick={dismissLevelUp}>Keep Learning <ArrowRight size={16} /></Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
