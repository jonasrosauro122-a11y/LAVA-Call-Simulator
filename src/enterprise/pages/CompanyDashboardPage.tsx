import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, UserCheck, GraduationCap, Activity, Mic, Award, Layers, TrendingUp, Cloud } from 'lucide-react';
import { ManagementHeader, PermissionGate, StatCard, DataTable } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { useManagement } from '../context/ManagementContext';

export function CompanyDashboardPage() {
  const { company, roster, cohorts } = useManagement();

  const byDept = useMemo(() => {
    const map = new Map<string, { count: number; score: number; voice: number; progress: number }>();
    for (const l of roster) {
      const d = map.get(l.department) ?? { count: 0, score: 0, voice: 0, progress: 0 };
      d.count++; d.score += l.avgScore; d.voice += l.voiceScore; d.progress += l.progressPct;
      map.set(l.department, d);
    }
    return [...map.entries()].map(([dept, d]) => ({
      dept, count: d.count, score: Math.round(d.score / d.count), voice: Math.round(d.voice / d.count), progress: Math.round(d.progress / d.count),
    }));
  }, [roster]);

  // Simple ROI proxy: completion × certificates normalized.
  const roi = Math.round((company.trainingCompletion / 100) * (company.certificatesIssued + company.activeLearners) * 1.5);

  return (
    <PermissionGate permission="view_company">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1"><Building2 size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Enterprise</span></div>
            <h1 className="section-title text-3xl">Acme Training Co.</h1>
            <p className="text-ink-500 dark:text-ink-400 mt-1">Organization overview across {company.departments} departments and {cohorts.length} cohorts.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatCard icon={Users} label="Total learners" value={company.totalLearners} />
            <StatCard icon={UserCheck} label="Active" value={company.activeLearners} accent="#16a34a" />
            <StatCard icon={GraduationCap} label="Completion" value={`${company.trainingCompletion}%`} accent="#7c3aed" />
            <StatCard icon={Activity} label="Avg comms" value={company.avgCommunication} accent="#0ea5e9" />
            <StatCard icon={Mic} label="Avg voice" value={company.avgVoice} accent="#db2777" />
            <StatCard icon={Award} label="Certificates" value={company.certificatesIssued} accent="#f59e0b" />
            <StatCard icon={Layers} label="Departments" value={company.departments} accent="#2563eb" />
            <StatCard icon={TrendingUp} label="Learning ROI" value={roi} accent="#16a34a" />
          </div>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Departments</h2>
            <DataTable
              columns={['Department', 'Learners', 'Avg Score', 'Avg Voice', 'Avg Progress']}
              rows={byDept.map((d) => [d.dept, d.count, d.score, d.voice, `${d.progress}%`])}
            />
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Trainer Performance</h2>
            <DataTable
              columns={['Cohort', 'Learners', 'Avg Score', 'At Risk']}
              rows={cohorts.map((c) => {
                const members = roster.filter((l) => c.memberIds.includes(l.id));
                const avg = members.length ? Math.round(members.reduce((s, l) => s + l.avgScore, 0) / members.length) : 0;
                return [c.name, members.length, avg, members.filter((l) => l.atRisk).length];
              })}
            />
          </Card>

          <Card className="p-6 border border-dashed border-ink-200 dark:border-ink-700 bg-transparent">
            <div className="flex items-start gap-3">
              <Cloud size={20} className="text-lava-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-display font-bold text-ink-800 dark:text-ink-100">Multi-tenant SaaS ready</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                  Company data is modeled through <code className="text-xs">company_profiles</code> and <code className="text-xs">company_members</code>. Each tenant can carry its own AI provider, voice provider, routing strategy, cost limits, and roles — isolated from other tenants. The role & permission engines already scope every management capability, so per-tenant policies plug in without touching business logic.
                </p>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
