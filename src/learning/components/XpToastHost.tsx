import { AnimatePresence, motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';

// Global stack of "+N XP" / event toasts, driven by the gamification context.
export function XpToastHost() {
  const { xpToasts } = useGamification();
  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {xpToasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-elevated gradient-lava text-white font-semibold text-sm"
          >
            {t.amount > 0 ? (
              <><Zap size={15} className="shrink-0" /> +{t.amount} XP</>
            ) : (
              <span className="whitespace-nowrap">{t.label}</span>
            )}
            {t.amount > 0 && <span className="text-white/80 font-normal">· {t.label}</span>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
