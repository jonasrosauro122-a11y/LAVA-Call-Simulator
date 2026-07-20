import { motion } from 'framer-motion';
import { Boxes, Users } from 'lucide-react';
import { ManagementHeader, PermissionGate, DataTable, ProgressBar } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { TrendChart } from '../../learning/analysis/components/TrendChart';
import { useManagement } from '../context/ManagementContext';
import { compareCohorts } from '../engines/cohortEngine';
import type { TrendPoint } from '../../learning/analysis/types';

export function CohortsPage() {
  const { cohorts, roster } = useManagement();
  const stats = compareCohorts(cohorts, roster);
  const chart: TrendPoint[] = stats.map((s) => ({
    date: s.cohort.id, label: s.cohort.name.split(' ')[0],
    'Avg Score': s.avgScore, 'Voice Score': s.avgVoiceScore, 'Progress': s.avgProgress,
  }));

  return (
    <PermissionGate permission="view_cohorts">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <Boxes size={22} className="text-lava-600" /><h1 className="section-title text-3xl">Cohorts</h1>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {stats.map((s) => (
              <Card key={s.cohort.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-ink-800 dark:text-ink-100">{s.cohort.name}</h3>
                  <span className="badge bg-ink-50 dark:bg-ink-800 text-ink-500">{s.cohort.kind}</span>
                </div>
                <p className="text-sm text-ink-500 dark:text-ink-400 flex items-center gap-1 mb-3"><Users size={14} /> {s.learners} learners</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-ink-500">Avg score</span><span className="font-semibold">{s.avgScore}</span></div>
                  <ProgressBar value={s.avgProgress} />
                  <div className="flex justify-between text-xs text-ink-400"><span>{s.avgProgress}% progress</span><span>{s.atRisk} at risk</span></div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Cohort Comparison</h2>
            <TrendChart data={chart} metrics={[{ key: 'Avg Score', color: '#8B0000' }, { key: 'Voice Score', color: '#db2777' }, { key: 'Progress', color: '#2563eb' }]} height={260} />
          </Card>

          <Card className="p-4">
            <DataTable
              columns={['Cohort', 'Kind', 'Learners', 'Avg Score', 'Voice', 'Completion', 'At Risk']}
              rows={stats.map((s) => [s.cohort.name, s.cohort.kind, s.learners, s.avgScore, s.avgVoiceScore, `${s.completionRate}%`, s.atRisk])}
            />
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
