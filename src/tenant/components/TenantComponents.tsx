import { motion } from 'framer-motion';
import type { TenantStatus, PlanTier } from '../types';

const STATUS_STYLE: Record<TenantStatus, string> = {
  active: 'bg-green-50 dark:bg-green-900/20 text-green-600',
  suspended: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  archived: 'bg-ink-100 dark:bg-ink-800 text-ink-500',
  deleted: 'bg-red-50 dark:bg-red-900/20 text-red-600',
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <span className={`badge ${STATUS_STYLE[status]}`}>{status}</span>;
}

const PLAN_STYLE: Record<PlanTier, string> = {
  free: 'bg-ink-100 dark:bg-ink-800 text-ink-500',
  starter: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600',
  professional: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
  business: 'bg-lava-50 dark:bg-lava-950/40 text-lava-600',
  enterprise: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  custom: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
};

export function PlanBadge({ plan }: { plan: PlanTier }) {
  return <span className={`badge ${PLAN_STYLE[plan]}`}>{plan}</span>;
}

export function UsageBar({ label, used, limit, pct }: { label: string; used: number; limit: number; pct: number }) {
  const over = pct >= 100;
  const color = over ? '#b71c1c' : pct >= 80 ? '#f59e0b' : '#8B0000';
  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink-500 dark:text-ink-400">{label}</span>
        <span className="text-ink-700 dark:text-ink-200 font-mono">{fmt(used)} / {fmt(limit)}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}
