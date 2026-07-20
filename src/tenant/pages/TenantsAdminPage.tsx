import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Plus, Search, Pause, Play, Archive, Trash2, Copy } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PermissionGate, DataTable, StatCard } from '../../enterprise/components/ManagementComponents';
import { TenantStatusBadge, PlanBadge } from '../components/TenantComponents';
import { useTenant } from '../context/TenantProvider';
import { tenantEngine } from '../tenantEngine';
import { tenantProvisioner } from '../tenantProvisioner';
import type { PlanTier, TenantStatus } from '../types';

const PLAN_OPTIONS: PlanTier[] = ['free', 'starter', 'professional', 'business', 'enterprise', 'custom'];

export function TenantsAdminPage() {
  const navigate = useNavigate();
  const { tenants, refresh } = useTenant();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | TenantStatus>('all');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<PlanTier>('starter');

  const filtered = useMemo(() => tenants.filter((t) => {
    if (query && !t.name.toLowerCase().includes(query.toLowerCase()) && !t.slug.includes(query.toLowerCase())) return false;
    if (status !== 'all' && t.status !== status) return false;
    return true;
  }), [tenants, query, status]);

  const active = tenants.filter((t) => t.status === 'active').length;
  const suspended = tenants.filter((t) => t.status === 'suspended').length;

  const createTenant = () => {
    if (!name.trim()) return;
    tenantProvisioner.provision({ name: name.trim(), plan });
    setName(''); setOpen(false); refresh();
  };

  return (
    <PermissionGate permission="manage_roles">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-ink-100 dark:border-ink-800">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
            <button onClick={() => navigate('/admin/platform')} className="btn-ghost text-sm"><ArrowLeft size={16} /> Platform</button>
            <span className="font-display font-bold text-lava-700 dark:text-lava-400">Tenant Management</span>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Building2 size={22} className="text-lava-600" /><h1 className="section-title text-3xl">Organizations</h1></div>
            <Button onClick={() => setOpen((v) => !v)}><Plus size={16} /> New tenant</Button>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Building2} label="Total tenants" value={tenants.length} />
            <StatCard icon={Play} label="Active" value={active} accent="#16a34a" />
            <StatCard icon={Pause} label="Suspended" value={suspended} accent="#f59e0b" />
            <StatCard icon={Building2} label="Plans" value={new Set(tenants.map((t) => t.plan)).size} accent="#7c3aed" />
          </div>

          {open && (
            <Card className="p-5">
              <div className="grid md:grid-cols-3 gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name…" className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200 md:col-span-2" />
                <select value={plan} onChange={(e) => setPlan(e.target.value as PlanTier)} className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200">
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <p className="text-xs text-ink-400 mt-2">Creating a tenant auto-provisions roles, permissions, branding, flags, AI, voice, and learning defaults.</p>
              <Button size="sm" className="mt-3" onClick={createTenant}>Create & provision</Button>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tenants…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200" />
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | TenantStatus)} className="rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-700 dark:text-ink-200">
                {['all', 'active', 'suspended', 'archived', 'deleted'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <DataTable
              columns={['Organization', 'Plan', 'Status', 'Domain', 'Actions']}
              onRowClick={(i) => navigate(`/admin/tenant/${filtered[i].id}`)}
              rows={filtered.map((t) => [
                <span className="font-medium">{t.name}</span>,
                <PlanBadge plan={t.plan} />,
                <TenantStatusBadge status={t.status} />,
                <span className="text-xs text-ink-400">{t.domains[0]?.host ?? '—'}</span>,
                <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {t.status === 'suspended'
                    ? <button className="btn-ghost text-xs" title="Reactivate" onClick={() => { tenantEngine.reactivate(t.id); refresh(); }}><Play size={14} /></button>
                    : <button className="btn-ghost text-xs" title="Suspend" onClick={() => { tenantEngine.suspend(t.id); refresh(); }}><Pause size={14} /></button>}
                  <button className="btn-ghost text-xs" title="Archive" onClick={() => { tenantEngine.archive(t.id); refresh(); }}><Archive size={14} /></button>
                  <button className="btn-ghost text-xs" title="Clone" onClick={() => { tenantEngine.clone(t.id, `${t.name} Copy`); refresh(); }}><Copy size={14} /></button>
                  <button className="btn-ghost text-xs text-red-600" title="Delete" onClick={() => { tenantEngine.softDelete(t.id); refresh(); }}><Trash2 size={14} /></button>
                </span>,
              ])}
            />
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
