import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, TrendingUp, Award, Mic, Activity, CalendarClock, AlertTriangle, Trophy, CheckSquare } from 'lucide-react';
import { ManagementHeader, PermissionGate, StatCard, DataTable, InitialsAvatar, RiskBadge } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { useManagement } from '../context/ManagementContext';
import { computeAssignmentProgress } from '../engines/assignmentEngine';

export function TrainerDashboardPage() {
  const navigate = useNavigate();
  const { roster, assignments, notifications, company } = useManagement();

  const active = roster.filter((l) => l.lastActiveDaysAgo <= 7).length;
  const attendance = Math.round(roster.reduce((s, l) => s + l.attendancePct, 0) / (roster.length || 1));
  const avgSim = Math.round(roster.reduce((s, l) => s + l.communicationScore, 0) / (roster.length || 1));
  const leaderboard = [...roster].sort((a, b) => b.xp - a.xp).slice(0, 5);
  const upcoming = [...assignments]
    .map((a) => computeAssignmentProgress(a, roster))
    .sort((a, b) => new Date(a.assignment.dueAt).getTime() - new Date(b.assignment.dueAt).getTime())
    .slice(0, 5);
  const alerts = notifications.filter((n) => n.kind === 'system' || n.kind === 'deadline').slice(0, 4);

  return (
    <PermissionGate permission="view_learners">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="section-title text-3xl">Class Overview</h1>
            <p className="text-ink-500 dark:text-ink-400 mt-1">{company.totalLearners} learners across {company.departments} departments.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Users} label="Total learners" value={company.totalLearners} />
            <StatCard icon={UserCheck} label="Active (7d)" value={active} accent="#16a34a" />
            <StatCard icon={CalendarClock} label="Attendance" value={`${attendance}%`} accent="#2563eb" />
            <StatCard icon={TrendingUp} label="Avg progress" value={`${company.trainingCompletion}%`} accent="#7c3aed" />
            <StatCard icon={Activity} label="Avg comms" value={avgSim} accent="#0ea5e9" />
            <StatCard icon={Mic} label="Avg voice" value={company.avgVoice} accent="#db2777" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Leaderboard */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><Trophy size={18} className="text-lava-600" /> Leaderboard</h2>
              <DataTable
                columns={['#', 'Learner', 'XP', 'Level', 'Avg', 'Status']}
                onRowClick={(i) => navigate(`/trainer/learner/${leaderboard[i].id}`)}
                rows={leaderboard.map((l, i) => [
                  i + 1,
                  <span className="flex items-center gap-2"><InitialsAvatar name={l.name} size={26} /> {l.name}{l.isCurrentUser ? ' (you)' : ''}</span>,
                  l.xp.toLocaleString(), l.level, l.avgScore, <RiskBadge atRisk={l.atRisk} />,
                ])}
              />
            </Card>

            {/* Alerts */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-lava-600" /> Alerts</h2>
              <div className="space-y-3">
                {alerts.length === 0 && <p className="text-sm text-ink-500 dark:text-ink-400">No alerts.</p>}
                {alerts.map((a) => (
                  <div key={a.id} className="text-sm">
                    <p className="font-medium text-ink-800 dark:text-ink-100">{a.title}</p>
                    <p className="text-ink-500 dark:text-ink-400 text-xs">{a.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-ink-100 dark:border-ink-800 grid grid-cols-2 gap-3 text-center">
                <div><p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{company.certificatesIssued}</p><p className="text-xs text-ink-500 flex items-center justify-center gap-1"><Award size={12} /> Certificates</p></div>
                <div><p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{company.atRisk}</p><p className="text-xs text-ink-500">At-risk</p></div>
              </div>
            </Card>
          </div>

          {/* Upcoming tasks */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><CheckSquare size={18} className="text-lava-600" /> Upcoming Tasks</h2>
            <DataTable
              columns={['Assignment', 'Type', 'Due', 'Completion', 'Status']}
              onRowClick={() => navigate('/trainer/assignments')}
              rows={upcoming.map((w) => [
                w.assignment.title,
                w.assignment.type,
                new Date(w.assignment.dueAt).toLocaleDateString(),
                `${w.completionRate}%`,
                w.overdue ? <span className="badge bg-red-50 dark:bg-red-900/20 text-red-600">Overdue</span> : <span className="badge bg-ink-50 dark:bg-ink-800 text-ink-500">On track</span>,
              ])}
            />
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
