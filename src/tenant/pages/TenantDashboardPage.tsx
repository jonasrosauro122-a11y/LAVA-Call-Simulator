import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Mic, Cpu, HardDrive, Award, Activity, FileText, Globe, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PermissionGate, DataTable, StatCard } from '../../enterprise/components/ManagementComponents';
import { TenantStatusBadge, PlanBadge, UsageBar } from '../components/TenantComponents';
import { useTenant } from '../context/TenantProvider';
import { subscriptionService } from '../subscriptionService';
import { tenantUsageService } from '../tenantUsageService';
import { tenantLimitService } from '../tenantLimitService';
import { tenantConfigurationService } from '../tenantConfigurationService';
import { tenantDomainService } from '../tenantDomainService';
import { tenantMigrationService } from '../tenantMigrationService';
import { auditService } from '../../platform/auditService';
import type { PlanTier, UsageMetric } from '../types';

const PLAN_OPTIONS: PlanTier[] = ['free', 'starter', 'professional', 'business', 'enterprise', 'custom'];

export function TenantDashboardPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { contextFor, refresh } = useTenant();
  const ctx = contextFor(tenantId ?? 'default');
  const tenant = ctx.tenant;

  const usage = tenantUsageService.get(ctx);
  const plan = subscriptionService.planFor(ctx);
  const { violations, limits } = useMemo(() => tenantLimitService.evaluate(ctx, usage), [ctx, usage]);
  const flags = tenantConfigurationService.getFlags(ctx);
  const ai = tenantConfigurationService.getAI(ctx);
  const voice = tenantConfigurationService.getVoice(ctx);
  const domains = tenantDomainService.list(ctx);
  const audit = auditService.list().filter((a) => a.target === ctx.tenantId).slice(0, 12);

  if (!tenant) {
    return (
      <PermissionGate permission="manage_roles">
        <div className="min-h-screen bg-ink-100 dark:bg-ink-950 flex items-center justify-center">
          <div className="text-center"><p className="text-ink-500 dark:text-ink-400">Tenant not found.</p><Button className="mt-4" onClick={() => navigate('/admin/tenants')}>Back</Button></div>
        </div>
      </PermissionGate>
    );
  }

  const bars: { label: string; metric: UsageMetric; limitKey: keyof typeof limits }[] = [
    { label: 'Users', metric: 'users', limitKey: 'maxUsers' },
    { label: 'Voice minutes', metric: 'voiceMinutes', limitKey: 'voiceMinutes' },
    { label: 'AI tokens', metric: 'aiTokens', limitKey: 'aiTokens' },
    { label: 'Storage (MB)', metric: 'storageMb', limitKey: 'storageMb' },
    { label: 'Simulations', metric: 'simulations', limitKey: 'maxSimulations' },
    { label: 'API calls', metric: 'apiCalls', limitKey: 'apiCalls' },
  ];

  return (
    <PermissionGate permission="manage_roles">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-ink-100 dark:border-ink-800">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
            <button onClick={() => navigate('/admin/tenants')} className="btn-ghost text-sm"><ArrowLeft size={16} /> Tenants</button>
            <span className="font-display font-bold text-lava-700 dark:text-lava-400">{tenant.name}</span>
            <TenantStatusBadge status={tenant.status} />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{tenant.name}</h1>
              <p className="text-sm text-ink-500 dark:text-ink-400">{tenant.slug} · created {new Date(tenant.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <PlanBadge plan={tenant.plan} />
              <select value={tenant.plan} onChange={(e) => { subscriptionService.changePlan(ctx, e.target.value as PlanTier); refresh(); }}
                className="text-sm rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-2 py-1.5 text-ink-700 dark:text-ink-200">
                {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </motion.div>

          {violations.length > 0 && (
            <Card className="p-4 border border-red-200 dark:border-red-900/40">
              <p className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={16} /> {violations.length} limit(s) exceeded: {violations.map((v) => v.metric).join(', ')}</p>
            </Card>
          )}

          {/* Usage stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatCard icon={Users} label="Users" value={usage.users} />
            <StatCard icon={Mic} label="Voice min" value={usage.voiceMinutes.toLocaleString()} accent="#db2777" />
            <StatCard icon={Cpu} label="AI tokens" value={`${(usage.aiTokens / 1000).toFixed(0)}k`} accent="#7c3aed" />
            <StatCard icon={HardDrive} label="Storage MB" value={usage.storageMb.toLocaleString()} accent="#2563eb" />
            <StatCard icon={Activity} label="Simulations" value={usage.simulations.toLocaleString()} accent="#0ea5e9" />
            <StatCard icon={Award} label="Certificates" value={usage.certificates} accent="#16a34a" />
            <StatCard icon={FileText} label="Reports" value={usage.reports} accent="#f59e0b" />
            <StatCard icon={Activity} label="Learning hrs" value={usage.learningHours.toLocaleString()} accent="#8B0000" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Usage vs limits */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Usage &amp; Limits — {plan.name}</h2>
              <div className="space-y-3">
                {bars.map((b) => (
                  <UsageBar key={b.metric} label={b.label} used={usage[b.metric]} limit={limits[b.limitKey]} pct={tenantLimitService.pct(ctx, usage, b.metric)} />
                ))}
              </div>
            </Card>

            {/* Feature flags */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Feature Flags</h2>
              <div className="space-y-2">
                {Object.keys(flags).map((key) => {
                  const on = tenantConfigurationService.isFeatureEnabled(ctx, key);
                  const allowed = subscriptionService.featureAllowed(ctx, key);
                  return (
                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-ink-50 dark:border-ink-800/50">
                      <div>
                        <p className="text-sm text-ink-800 dark:text-ink-100">{key.replace(/_/g, ' ')}</p>
                        {!allowed && <p className="text-[11px] text-amber-600">not in {plan.name} plan</p>}
                      </div>
                      <button disabled={!allowed} onClick={() => { tenantConfigurationService.setFlag(ctx, key, !flags[key]); refresh(); }}
                        className={`w-11 h-6 rounded-full transition-colors relative ${on ? 'bg-lava-600' : 'bg-ink-300 dark:bg-ink-700'} ${!allowed ? 'opacity-40 cursor-not-allowed' : ''}`} aria-label={`Toggle ${key}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${on ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI + Voice config */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">AI &amp; Voice Configuration</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-400 mb-1">AI</p>
                  <p className="text-ink-700 dark:text-ink-200">Provider: {ai.provider}</p>
                  <p className="text-ink-700 dark:text-ink-200">Model: {ai.model}</p>
                  <p className="text-ink-700 dark:text-ink-200">Routing: {ai.routingStrategy}</p>
                  <p className="text-ink-700 dark:text-ink-200">Cost limit: ${ai.costLimitUsd}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-400 mb-1">Voice</p>
                  <p className="text-ink-700 dark:text-ink-200">Speech: {voice.speechProvider}</p>
                  <p className="text-ink-700 dark:text-ink-200">Realtime: {voice.realtimeProvider}</p>
                  <p className="text-ink-700 dark:text-ink-200">Language: {voice.language} / {voice.accent}</p>
                  <p className="text-ink-700 dark:text-ink-200">Confidence: {voice.confidenceThreshold}</p>
                </div>
              </div>
            </Card>

            {/* Domains + isolation */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><Globe size={18} className="text-lava-600" /> Domains</h2>
              <div className="space-y-1 mb-4">
                {domains.map((d) => (
                  <div key={d.host} className="flex items-center justify-between text-sm">
                    <span className="text-ink-700 dark:text-ink-200 font-mono text-xs">{d.host}</span>
                    <span className={`badge ${d.verified ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-ink-100 dark:bg-ink-800 text-ink-500'}`}>{d.kind}{d.verified ? ' · verified' : ''}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-ink-100 dark:border-ink-800">
                <p className="text-xs uppercase tracking-wide text-ink-400 mb-2 flex items-center gap-1"><ShieldCheck size={13} /> Isolation readiness</p>
                {tenantMigrationService.readiness().map((r) => (
                  <p key={r.item} className="text-xs flex items-center gap-2">
                    <span className={r.ready ? 'text-green-600' : 'text-ink-400'}>{r.ready ? '✓' : '○'}</span>
                    <span className="text-ink-600 dark:text-ink-300">{r.item}</span>
                  </p>
                ))}
              </div>
            </Card>
          </div>

          {/* Audit summary */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Audit Summary</h2>
            {audit.length === 0
              ? <p className="text-sm text-ink-400">No tenant-scoped audit entries yet. Actions on this tenant will appear here.</p>
              : <DataTable columns={['Action', 'Actor', 'Severity', 'Time']} rows={audit.map((a) => [a.action, a.actor, a.severity, new Date(a.timestamp).toLocaleTimeString()])} />}
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
