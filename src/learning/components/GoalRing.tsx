import { ProgressRing } from '../../components/ui/ProgressRing';

interface GoalRingProps {
  earned: number;
  goal: number;
  label: string;
  size?: number;
}

// Reuses the existing ProgressRing; turns green once the goal is met.
export function GoalRing({ earned, goal, label, size = 96 }: GoalRingProps) {
  const pct = goal > 0 ? Math.min(100, (earned / goal) * 100) : 0;
  const met = earned >= goal && goal > 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <ProgressRing
        value={pct}
        size={size}
        strokeWidth={8}
        label={`${earned}`}
        sublabel={`/ ${goal} XP`}
        color={met ? '#16a34a' : '#8B0000'}
      />
      <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}
