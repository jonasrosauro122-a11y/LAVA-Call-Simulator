import { motion } from 'framer-motion';
import { BarChart3, AlertTriangle, TrendingUp, Trophy } from 'lucide-react';
import { ManagementHeader, PermissionGate, DataTable, InitialsAvatar, StatCard } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { TrendChart } from '../../learning/analysis/components/TrendChart';
import { useManagement } from '../context/ManagementContext';
import { compareCohorts } from '../engines/cohortEngine';
import type { TrendPoint } from '../../learning/analysis/types';

export function TrainerAnalyticsPage() {
  const { roster, cohorts, company } = useManagement();
  const atRisk = roster.filter((l) => l.atRisk).sort((a, b) => a.avgScore - b.avgScore);
  const leaders = [...roster].sort((a, b) => b.xp - a.xp).slice(0, 5);
  const velocity = Math.round(roster.reduce((s, l) => s + l.trend, 0) / (roster.length || 1));

  // Cohort-based series for the shared TrendChart.
  const stats = compareCohorts(cohorts, roster);
  const series: TrendPoint[] = stats.map((s) => ({
    date: s.cohort.id, label: s.cohort.name.split(' ')[0],
    'Avg Score': s.avgScore, 'Voice': s.avgVoiceScore, 'Completion': s.completionRate,
  }));

  return (
    <PermissionGate permission="view_analytics">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <BarChart3 size={22} className="text-lava-600" /><h1 className="section-title text-3xl">Performance Analytics</h1>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={TrendingUp} label="Avg communication" value={company.avgCommunication} />
            <StatCard icon={TrendingUp} label="Avg voice" value={company.avgVoice} accent="#db2777" />
            <StatCard icon={TrendingUp} label="Learning velocity" value={`${velocity > 0 ? '+' : ''}${velocity}`} accent="#16a34a" />
            <StatCard icon={AlertTriangle} label="At-risk learners" value={atRisk.length} accent="#b71c1c" />
          </div>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Scores, Voice & Completion by Cohort</h2>
            <TrendChart data={series} metrics={[{ key: 'Avg Score', color: '#8B0000' }, { key: 'Voice', color: '#db2777' }, { key: 'Completion', color: '#2563eb' }]} height={280} />
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-lava-600" /> At-Risk Learners</h2>
              <DataTable
                columns={['Learner', 'Avg', 'Confidence', 'Progress']}
                rows={atRisk.slice(0, 8).map((l) => [
                  <span className="flex items-center gap-2"><InitialsAvatar name={l.name} size={24} /> {l.name}</span>,
                  l.avgScore, l.confidence, `${l.progressPct}%`,
                ])}
              />
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><Trophy size={18} className="text-lava-600" /> Top Performers</h2>
              <DataTable
                columns={['Learner', 'XP', 'Level', 'Avg']}
                rows={leaders.map((l) => [
                  <span className="flex items-center gap-2"><InitialsAvatar name={l.name} size={24} /> {l.name}</span>,
                  l.xp.toLocaleString(), l.level, l.avgScore,
                ])}
              />
            </Card>
          </div>
        </main>
      </div>
    </PermissionGate>
  );
}
