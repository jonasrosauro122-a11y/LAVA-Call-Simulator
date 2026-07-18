import { motion } from 'framer-motion';
import { CheckCircle2, Lock, PlayCircle, Circle, Clock, ArrowRight } from 'lucide-react';
import type { CourseModule, ModuleProgress } from '../types/learning';

interface ModuleListItemProps {
  module: CourseModule;
  progress: ModuleProgress;
  order: number;
  onOpen: () => void;
  index?: number;
}

const statusMeta: Record<string, { icon: typeof CheckCircle2; wrap: string; label: string }> = {
  completed: { icon: CheckCircle2, wrap: 'bg-green-50 dark:bg-green-900/20 text-green-600', label: 'Completed' },
  in_progress: { icon: PlayCircle, wrap: 'gradient-lava text-white', label: 'In Progress' },
  available: { icon: Circle, wrap: 'bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400', label: 'Available' },
  locked: { icon: Lock, wrap: 'bg-ink-100 dark:bg-ink-800 text-ink-400', label: 'Locked' },
};

export function ModuleListItem({ module, progress, order, onOpen, index = 0 }: ModuleListItemProps) {
  const meta = statusMeta[progress.status];
  const Icon = meta.icon;
  const locked = progress.status === 'locked';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={locked ? undefined : onOpen}
      className={`card p-4 flex items-center gap-4 transition-all ${
        locked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-elevated cursor-pointer'
      } ${progress.status === 'in_progress' ? 'ring-2 ring-lava-500/40' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.wrap}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-ink-400">M{order}</span>
          <h4 className="font-semibold text-ink-800 dark:text-ink-100 text-sm truncate">{module.title}</h4>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-ink-500 dark:text-ink-400">
          <span className="flex items-center gap-1"><Clock size={11} /> {module.estimatedMinutes}m</span>
          <span>{progress.lessonsDone}/{progress.lessonsTotal} lessons</span>
          <span className={progress.quizPassed ? 'text-green-600' : ''}>Quiz {progress.quizPassed ? '✓' : '–'}</span>
          <span className={progress.simulationPassed ? 'text-green-600' : ''}>
            Sim {progress.simulationScore != null ? Math.round(progress.simulationScore) : '–'}
          </span>
        </div>
      </div>
      <span className="text-xs text-ink-400 hidden sm:block">{meta.label}</span>
      {!locked && <ArrowRight size={16} className="text-ink-400 shrink-0" />}
    </motion.div>
  );
}
