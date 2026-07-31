import { Target, Dumbbell, User, Building2 } from 'lucide-react';
import { Card } from './ui/Card';
import { getPositionTaskByLabel, getPositionTask } from '../lib/positionTasksBank';
import type { PositionScenario } from '../lib/positionTasksBank';
import type { PositionId } from '../lib/positionBank';

// Shows a candidate's role-specific practice content — one Personal-lines and one
// Commercial-lines insurance scenario, each with its TASK and hands-on ACTIVITY.
// Accepts either the stored position label or a PositionId.
export function PositionFocusCard({ positionLabel, positionId }: { positionLabel?: string; positionId?: PositionId }) {
  const entry = positionId ? getPositionTask(positionId) : positionLabel ? getPositionTaskByLabel(positionLabel) : undefined;
  if (!entry) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-lava-700 dark:text-lava-400 font-semibold uppercase tracking-wide">Role Practice Focus</span>
        <span className="badge bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400">{entry.label}</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {entry.scenarios.map((s) => (
          <ScenarioBlock key={s.line} scenario={s} />
        ))}
      </div>
    </Card>
  );
}

function ScenarioBlock({ scenario }: { scenario: PositionScenario }) {
  const isPersonal = scenario.line === 'personal';
  const LineIcon = isPersonal ? User : Building2;
  const lineLabel = isPersonal ? 'Personal Lines' : 'Commercial Lines';
  const lineTint = isPersonal
    ? 'bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400'
    : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300';

  return (
    <div className="rounded-xl border border-ink-100 dark:border-ink-800 p-4 space-y-3">
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${lineTint}`}>
        <LineIcon size={13} /> {lineLabel}
      </span>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg gradient-lava flex items-center justify-center text-white shrink-0"><Target size={16} /></div>
        <div>
          <p className="text-xs font-semibold text-ink-800 dark:text-ink-100 mb-0.5">Simulation Task</p>
          <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{scenario.task}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-ink-100 dark:bg-ink-800 flex items-center justify-center text-lava-700 dark:text-lava-400 shrink-0"><Dumbbell size={16} /></div>
        <div>
          <p className="text-xs font-semibold text-ink-800 dark:text-ink-100 mb-0.5">Practice Activity</p>
          <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{scenario.activity}</p>
        </div>
      </div>
    </div>
  );
}
