import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Radio, ScrollText, Flag, SlidersHorizontal, Puzzle, ListChecks,
  CalendarClock, Webhook as WebhookIcon, Plug, Palette, Send, Play, Rocket, Disc3,
} from 'lucide-react';
import { RecordingsAdmin } from '../../learning/recording/components/RecordingLibrary';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PermissionGate, DataTable, StatCard } from '../../enterprise/components/ManagementComponents';
import { usePlatform } from '../context/PlatformContext';

type Tab = 'overview' | 'events' | 'audit' | 'flags' | 'config' | 'plugins' | 'jobs' | 'scheduler' | 'webhooks' | 'integrations' | 'branding' | 'recordings';

const TABS: { id: Tab; label: string; icon: typeof Radio }[] = [
  { id: 'overview', label: 'Overview', icon: SlidersHorizontal },
  { id: 'events', label: 'Event Bus', icon: Radio },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
  { id: 'flags', label: 'Feature Flags', icon: Flag },
  { id: 'config', label: 'Configuration', icon: SlidersHorizontal },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
  { id: 'jobs', label: 'Jobs', icon: ListChecks },
  { id: 'scheduler', label: 'Scheduler', icon: CalendarClock },
  { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'recordings', label: 'Recordings', icon: Disc3 },
];

const SEV_COLOR: Record<string, string> = { info: '#6b7280', notice: '#2563eb', warning: '#f59e0b', critical: '#b71c1c' };
const JOB_COLOR: Record<string, string> = { queued: '#6b7280', running: '#2563eb', completed: '#16a34a', failed: '#b71c1c', scheduled: '#7c3aed' };

export function PlatformAdminPage() {
  const navigate = useNavigate();
  const p = usePlatform();
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <PermissionGate permission="manage_roles">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-ink-100 dark:border-ink-800">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
            <button onClick={() => navigate('/trainer')} className="btn-ghost text-sm"><ArrowLeft size={16} /> Console</button>
            <span className="font-display font-bold text-lava-700 dark:text-lava-400">Platform Admin</span>
            <button onClick={() => navigate('/admin/tenants')} className="btn-ghost text-sm ml-2"><Plug size={15} /> Tenants</button>
            <button onClick={() => navigate('/admin/launch')} className="btn-ghost text-sm"><Rocket size={15} /> Launch</button>
            <span className="ml-auto text-xs text-ink-400">Infrastructure services</span>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-title text-3xl mb-6">Platform Core</motion.h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${tab === t.id ? 'bg-lava-700 text-white' : 'bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={Radio} label="Subscriptions" value={p.eventBus.subscriptionCount()} />
              <StatCard icon={ScrollText} label="Audit entries" value={p.auditService.count()} accent="#2563eb" />
              <StatCard icon={Flag} label="Feature flags" value={p.featureFlags.list().length} accent="#f59e0b" />
              <StatCard icon={Puzzle} label="Plugins" value={p.plugins.list().length} accent="#7c3aed" />
              <StatCard icon={ListChecks} label="Jobs" value={p.jobQueue.list().length} accent="#16a34a" />
              <StatCard icon={Plug} label="Integrations" value={p.integrations.list().length} accent="#db2777" />
            </div>
          )}

          {tab === 'events' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-ink-800 dark:text-ink-100">Recent Events</h2>
                <Button size="sm" onClick={() => void p.eventBus.publish('AchievementUnlocked', { demo: true }, { source: 'admin', metadata: { actor: 'admin' } })}><Send size={14} /> Emit test event</Button>
              </div>
              <DataTable columns={['Type', 'Source', 'Correlation', 'Time']}
                rows={p.eventBus.getHistory(30).map((e) => [e.type, e.source ?? '—', e.correlationId.slice(0, 12), new Date(e.timestamp).toLocaleTimeString()])} />
            </Card>
          )}

          {tab === 'audit' && (
            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Audit Log</h2>
              <DataTable columns={['Severity', 'Actor', 'Action', 'Target', 'Time']}
                rows={p.auditService.list().slice(0, 40).map((a) => [
                  <span className="badge text-white" style={{ background: SEV_COLOR[a.severity] }}>{a.severity}</span>,
                  a.actor, a.action, a.target ?? '—', new Date(a.timestamp).toLocaleTimeString(),
                ])} />
            </Card>
          )}

          {tab === 'flags' && (
            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Feature Flags</h2>
              <div className="space-y-2">
                {p.featureFlags.list().map((f) => {
                  const on = p.featureFlags.isEnabled(f.id);
                  return (
                    <div key={f.id} className="flex items-center justify-between py-2 border-b border-ink-50 dark:border-ink-800/50">
                      <div><p className="font-medium text-sm text-ink-800 dark:text-ink-100">{f.label}</p><p className="text-xs text-ink-400">{f.id}</p></div>
                      <button onClick={() => { p.featureFlags.set(f.id, !on); p.refresh(); }}
                        className={`w-11 h-6 rounded-full transition-colors relative ${on ? 'bg-lava-600' : 'bg-ink-300 dark:bg-ink-700'}`} aria-label={`Toggle ${f.label}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${on ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {tab === 'config' && (
            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Configuration</h2>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                {Object.entries(p.config.getAll()).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1.5 border-b border-ink-50 dark:border-ink-800/50">
                    <span className="text-ink-500">{k}</span>
                    <span className="text-ink-800 dark:text-ink-200 font-mono text-xs text-right break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { p.config.set({ region: p.config.get('region') === 'US' ? 'EU' : 'US' }); }}>Toggle region</Button>
                <Button size="sm" variant="ghost" onClick={() => p.config.reset()}>Reset</Button>
              </div>
            </Card>
          )}

          {tab === 'plugins' && (
            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Registered Plugins</h2>
              <DataTable columns={['Name', 'Kind', 'Version', 'Registered']}
                rows={p.plugins.list().map((pl) => [pl.name, pl.kind, pl.version, new Date(pl.registeredAt).toLocaleDateString()])} />
            </Card>
          )}

          {tab === 'jobs' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-ink-800 dark:text-ink-100">Background Jobs</h2>
                <Button size="sm" onClick={() => { p.jobQueue.enqueue('report.build', { adhoc: true }); p.refresh(); }}><Play size={14} /> Enqueue demo job</Button>
              </div>
              <DataTable columns={['Type', 'Status', 'Attempts', 'Created']}
                rows={p.jobQueue.list().slice(0, 30).map((j) => [
                  j.type,
                  <span className="badge text-white" style={{ background: JOB_COLOR[j.status] }}>{j.status}</span>,
                  `${j.attempts}/${j.maxAttempts}`, new Date(j.createdAt).toLocaleTimeString(),
                ])} />
            </Card>
          )}

          {tab === 'scheduler' && (
            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Scheduled Tasks</h2>
              <DataTable columns={['Task', 'Cron', 'Enabled', 'Next run']}
                rows={p.scheduler.list().map((t) => [
                  t.name, <code className="text-xs">{t.cron}</code>,
                  <button onClick={() => { p.scheduler.setEnabled(t.id, !t.enabled); p.refresh(); }} className={`badge ${t.enabled ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-ink-100 dark:bg-ink-800 text-ink-400'}`}>{t.enabled ? 'on' : 'off'}</button>,
                  new Date(t.nextRun).toLocaleString(),
                ])} />
            </Card>
          )}

          {tab === 'webhooks' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-ink-800 dark:text-ink-100">Webhooks</h2>
                <Button size="sm" onClick={() => { p.webhooks.register({ label: 'Slack demo', direction: 'outgoing', url: 'https://hooks.slack.example', events: ['*'] }); p.refresh(); }}>Register outgoing</Button>
              </div>
              <DataTable columns={['Label', 'Direction', 'Events', 'Active']}
                rows={p.webhooks.list().map((w) => [w.label, w.direction, w.events.join(', '), w.active ? 'yes' : 'no'])} />
              <p className="text-xs text-ink-400">Deliveries logged: {p.webhooks.deliveries().length}. Real HTTP delivery attaches via a transport in a later stage.</p>
            </Card>
          )}

          {tab === 'integrations' && (
            <Card className="p-6">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Integration Catalog</h2>
              <DataTable columns={['Name', 'Category', 'Capabilities', 'Status']}
                rows={p.integrations.list().map((d) => [
                  d.name, d.category, d.capabilities.join(', '),
                  <span className="badge bg-ink-100 dark:bg-ink-800 text-ink-500">{d.available ? 'connector ready' : 'planned'}</span>,
                ])} />
            </Card>
          )}

          {tab === 'branding' && (
            <Card className="p-6 max-w-lg">
              <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4">Branding Engine</h2>
              {(() => { const b = p.branding.get(); return (
                <div className="space-y-3 text-sm">
                  <label className="block"><span className="text-ink-500">Company name</span>
                    <input value={b.companyName} onChange={(e) => p.branding.set({ companyName: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-700 dark:text-ink-200" /></label>
                  <label className="block"><span className="text-ink-500">Primary color</span>
                    <input type="color" value={b.primaryColor} onChange={(e) => p.branding.set({ primaryColor: e.target.value })} className="mt-1 h-10 w-20 rounded" /></label>
                  <p className="text-xs text-ink-400">Per-company white-label is architected but not applied to the live UI yet.</p>
                  <Button size="sm" variant="ghost" onClick={() => p.branding.reset()}>Reset to LAVA</Button>
                </div>
              ); })()}
            </Card>
          )}

          {tab === 'recordings' && <RecordingsAdmin />}
        </main>
      </div>
    </PermissionGate>
  );
}
