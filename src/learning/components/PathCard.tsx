import { motion } from 'framer-motion';
import { Clock, Layers, Zap, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { pathIcon } from './icons';
import { xpFor } from '../lib/xpEngine';
import type { LearningPath, PathProgress } from '../types/learning';

interface PathCardProps {
  path: LearningPath;
  progress: PathProgress;
  enrolled: boolean;
  onOpen: () => void;
  onStart: () => void;
  index?: number;
}

const levelStyles: Record<string, string> = {
  Foundational: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  Core: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  Specialized: 'text-lava-700 dark:text-lava-400 bg-lava-50 dark:bg-lava-950/40',
};

export function PathCard({ path, progress, enrolled, onOpen, onStart, index = 0 }: PathCardProps) {
  const Icon = pathIcon(path.icon);
  const totalXp = path.modules.reduce((s, m) => s + m.xpReward, 0) + xpFor('path_complete');
  const status = progress.complete ? 'Completed' : enrolled ? 'In Progress' : 'Not Started';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl gradient-lava flex items-center justify-center text-white shrink-0">
            <Icon size={22} />
          </div>
          <span className={`badge ${levelStyles[path.level]}`}>{path.level}</span>
        </div>

        <h3 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mt-4">{path.title}</h3>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 flex-1">{path.tagline}</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-ink-500 dark:text-ink-400">
              {progress.completedModules}/{progress.totalModules} modules
            </span>
            <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">{progress.progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
            <div className="h-full rounded-full gradient-lava" style={{ width: `${progress.progressPct}%` }} />
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="rounded-lg bg-ink-50 dark:bg-ink-800/50 py-2">
            <Clock size={14} className="mx-auto text-ink-400" />
            <p className="text-xs font-semibold text-ink-700 dark:text-ink-200 mt-1">{path.estimatedHours}h</p>
          </div>
          <div className="rounded-lg bg-ink-50 dark:bg-ink-800/50 py-2">
            <Layers size={14} className="mx-auto text-ink-400" />
            <p className="text-xs font-semibold text-ink-700 dark:text-ink-200 mt-1">{path.modules.length}</p>
          </div>
          <div className="rounded-lg bg-ink-50 dark:bg-ink-800/50 py-2">
            <Zap size={14} className="mx-auto text-ink-400" />
            <p className="text-xs font-semibold text-ink-700 dark:text-ink-200 mt-1">{totalXp}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
            {progress.complete ? <CheckCircle2 size={13} className="text-green-600" />
              : enrolled ? <ArrowRight size={13} className="text-lava-600" />
              : <Lock size={13} className="text-ink-400" />}
            {status}
          </span>
        </div>

        <div className="flex gap-2 mt-3">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onOpen}>Details</Button>
          <Button size="sm" className="flex-1" onClick={onStart}>
            {enrolled ? 'Continue' : 'Start Learning'} <ArrowRight size={15} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
