import { CheckCircle2, Circle, Gift, type LucideIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import type { ChallengeView } from '../lib/challenges';

interface ChallengeListProps {
  title: string;
  icon: LucideIcon;
  items: ChallengeView[];
  emptyLabel?: string;
}

// Shared list used for both Daily Challenges and Weekly Goals.
export function ChallengeList({ title, icon: Icon, items, emptyLabel }: ChallengeListProps) {
  return (
    <Card className="p-5">
      <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2">
        <Icon size={18} className="text-lava-600" /> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-ink-500 dark:text-ink-400">{emptyLabel ?? 'Nothing here yet.'}</p>
      ) : (
        <div className="space-y-3">
          {items.map((cv) => {
            const done = cv.complete;
            const pct = Math.round((cv.current / cv.target) * 100);
            return (
              <div key={cv.challenge.id} className="flex items-center gap-3">
                {done ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <Circle size={18} className="text-ink-300 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${done ? 'text-ink-700 dark:text-ink-200' : 'text-ink-600 dark:text-ink-300'}`}>{cv.challenge.title}</p>
                    <span className="text-xs font-semibold text-lava-700 dark:text-lava-400 flex items-center gap-1 shrink-0">
                      <Gift size={12} /> {cv.challenge.reward}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden mt-1.5">
                    <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'gradient-lava'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs text-ink-400 w-10 text-right shrink-0">{cv.current}/{cv.target}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
