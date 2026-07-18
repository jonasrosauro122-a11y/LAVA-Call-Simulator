import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, Clock, Lightbulb, BookOpen, Quote, ListChecks } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Lesson, LessonBlockType } from '../types/learning';

interface LessonPanelProps {
  lesson: Lesson;
  done: boolean;
  order: number;
  onComplete: () => void;
}

const blockIcon: Record<LessonBlockType, typeof BookOpen> = {
  concept: BookOpen, example: ListChecks, tip: Lightbulb, keyTerms: ListChecks, script: Quote,
};

export function LessonPanel({ lesson, done, order, onComplete }: LessonPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800/40 transition-colors"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          done ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-ink-100 dark:bg-ink-800 text-ink-400'
        }`}>
          {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-ink-400">L{order}</span>
            <h4 className="font-semibold text-ink-800 dark:text-ink-100 text-sm truncate">{lesson.title}</h4>
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-1.5 mt-0.5">
            <Clock size={11} /> {lesson.estimatedMinutes} min · {lesson.summary}
          </p>
        </div>
        <ChevronDown size={18} className={`text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-ink-100 dark:border-ink-800">
              {lesson.blocks.map((b, i) => {
                const Icon = blockIcon[b.type];
                return (
                  <div key={i}>
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-lava-700 dark:text-lava-400 mb-1">
                      <Icon size={13} /> {b.title ?? b.type}
                    </p>
                    {b.body && <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{b.body}</p>}
                    {b.items && (
                      <ul className="mt-1 space-y-1">
                        {b.items.map((it, j) => (
                          <li key={j} className="text-sm text-ink-600 dark:text-ink-300 flex items-start gap-2">
                            <span className="text-lava-500 mt-1">•</span> {it}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-end">
                {done ? (
                  <span className="badge bg-green-50 dark:bg-green-900/20 text-green-600"><CheckCircle2 size={13} /> Completed</span>
                ) : (
                  <Button size="sm" onClick={onComplete}>Mark as complete</Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
