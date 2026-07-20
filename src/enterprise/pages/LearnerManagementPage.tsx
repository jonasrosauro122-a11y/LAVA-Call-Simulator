import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';
import { ManagementHeader, PermissionGate, DataTable, InitialsAvatar, RiskBadge, ProgressBar } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { useManagement } from '../context/ManagementContext';

export function LearnerManagementPage() {
  const navigate = useNavigate();
  const { roster } = useManagement();
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('all');
  const [risk, setRisk] = useState('all');

  const departments = useMemo(() => ['all', ...Array.from(new Set(roster.map((l) => l.department)))], [roster]);
  const filtered = useMemo(() => roster.filter((l) => {
    if (query && !l.name.toLowerCase().includes(query.toLowerCase()) && !l.email.toLowerCase().includes(query.toLowerCase())) return false;
    if (dept !== 'all' && l.department !== dept) return false;
    if (risk === 'risk' && !l.atRisk) return false;
    if (risk === 'ontrack' && l.atRisk) return false;
    return true;
  }), [roster, query, dept, risk]);

  return (
    <PermissionGate permission="view_learners">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <Users size={22} className="text-lava-600" />
            <h1 className="section-title text-3xl">Learners</h1>
            <span className="text-ink-400 text-sm ml-2">{filtered.length} of {roster.length}</span>
          </motion.div>

          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200" />
              </div>
              <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-700 dark:text-ink-200">
                {departments.map((d) => <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>)}
              </select>
              <select value={risk} onChange={(e) => setRisk(e.target.value)} className="rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-700 dark:text-ink-200">
                <option value="all">All statuses</option>
                <option value="risk">At risk</option>
                <option value="ontrack">On track</option>
              </select>
            </div>
          </Card>

          <Card className="p-4">
            <DataTable
              columns={['Learner', 'Department', 'Progress', 'Avg', 'Voice', 'Status']}
              onRowClick={(i) => navigate(`/trainer/learner/${filtered[i].id}`)}
              rows={filtered.map((l) => [
                <span className="flex items-center gap-2"><InitialsAvatar name={l.name} size={28} /> <span><span className="font-medium">{l.name}{l.isCurrentUser ? ' (you)' : ''}</span><br /><span className="text-xs text-ink-400">{l.email}</span></span></span>,
                l.department,
                <div className="w-28"><ProgressBar value={l.progressPct} /><span className="text-xs text-ink-400">{l.progressPct}%</span></div>,
                l.avgScore,
                l.voiceScore,
                <RiskBadge atRisk={l.atRisk} />,
              ])}
            />
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
