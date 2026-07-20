import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, RefreshCw, Cpu, Radio, AlertTriangle, Timer } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PermissionGate, StatCard, DataTable } from '../../enterprise/components/ManagementComponents';
import { EmptyState } from '../components/StateViews';
import { metrics, type ProviderState } from '../observability';

const PROVIDER_COLOR: Record<ProviderState, string> = {
  operational: '#16a34a', degraded: '#f59e0b', down: '#b71c1c', not_configured: '#6b7280',
};

export function HealthDashboardPage() {
  const navigate = useNavigate();
  const [snap, setSnap] = useState(() => metrics.snapshot());
  const topCounters = Object.entries(snap.counters).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const uptimeMin = Math.floor(snap.uptimeMs / 60000);

  return (
    <PermissionGate permission="manage_roles">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-ink-100 dark:border-ink-800">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
            <button onClick={() => navigate('/admin/launch')} className="btn-ghost text-sm"><ArrowLeft size={16} /> Launch</button>
            <span className="font-display font-bold text-lava-700 dark:text-lava-400">Health &amp; Metrics</span>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSnap(metrics.snapshot())}><RefreshCw size={14} /> Refresh</Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-title text-3xl flex items-center gap-2"><Activity size={24} className="text-lava-600" /> System Health</motion.h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Timer} label="Uptime (min)" value={uptimeMin} />
            <StatCard icon={Radio} label="Events" value={snap.counters['events.total'] ?? 0} accent="#2563eb" />
            <StatCard icon={AlertTriangle} label="Errors" value={snap.counters['errors.total'] ?? 0} accent="#b71c1c" />
            <StatCard icon={Cpu} label="Providers" value={Object.keys(snap.providers).length} accent="#7c3aed" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Provider Status</h2>
              {Object.keys(snap.providers).length === 0
                ? <EmptyState title="No provider activity yet" message="Provider status appears after AI/voice usage." />
                : <div className="space-y-2">
                    {Object.entries(snap.providers).map(([id, state]) => (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-ink-700 dark:text-ink-200">{id}</span>
                        <span className="badge text-white" style={{ background: PROVIDER_COLOR[state] }}>{state.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>}
            </Card>

            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Top Metrics</h2>
              {topCounters.length === 0
                ? <EmptyState title="No metrics yet" message="Interact with the app to generate metrics." />
                : <DataTable columns={['Metric', 'Count']} rows={topCounters.map(([k, v]) => [k, v])} />}
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Timings (p95)</h2>
            {Object.keys(snap.timings).length === 0
              ? <EmptyState title="No timing samples" message="Timed operations (AI calls) will appear here." />
              : <DataTable columns={['Operation', 'Samples', 'Avg ms', 'p95 ms']} rows={Object.entries(snap.timings).map(([k, t]) => [k, t.count, t.avgMs, t.p95Ms])} />}
          </Card>

          {snap.errors.length > 0 && (
            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Recent Errors</h2>
              <DataTable columns={['Scope', 'Message', 'Time']} rows={snap.errors.map((e) => [e.scope, e.message, new Date(e.at).toLocaleTimeString()])} />
            </Card>
          )}
        </main>
      </div>
    </PermissionGate>
  );
}
