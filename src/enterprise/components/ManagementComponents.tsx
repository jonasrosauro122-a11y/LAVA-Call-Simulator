import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Moon, Sun, ArrowLeft, LayoutDashboard, Users, Boxes, ClipboardList, BarChart3, FileText, Bell, Building2, ShieldAlert, Server, type LucideIcon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { useManagement } from '../context/ManagementContext';
import { managementRoles } from '../roles/roleEngine';
import type { Permission, Role } from '../types';
import { unreadCount } from '../engines/notificationEngine';

const NAV: { label: string; to: string; icon: LucideIcon; perm: Permission }[] = [
  { label: 'Dashboard', to: '/trainer', icon: LayoutDashboard, perm: 'view_learners' },
  { label: 'Learners', to: '/trainer/learners', icon: Users, perm: 'view_learners' },
  { label: 'Cohorts', to: '/trainer/cohorts', icon: Boxes, perm: 'view_cohorts' },
  { label: 'Assignments', to: '/trainer/assignments', icon: ClipboardList, perm: 'view_assignments' },
  { label: 'Analytics', to: '/trainer/analytics', icon: BarChart3, perm: 'view_analytics' },
  { label: 'Reports', to: '/trainer/reports', icon: FileText, perm: 'generate_reports' },
  { label: 'Company', to: '/company', icon: Building2, perm: 'view_company' },
  { label: 'Platform', to: '/admin/platform', icon: Server, perm: 'manage_roles' },
];

export function ManagementHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { role, setRole, can, notifications } = useManagement();
  const unread = unreadCount(notifications);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-ink-100 dark:border-ink-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost text-sm" aria-label="Back to learner app">
          <ArrowLeft size={16} /> <span className="hidden md:inline">Exit</span>
        </button>
        <span className="font-display font-bold text-lava-700 dark:text-lava-400">Trainer Console</span>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {NAV.filter((n) => can(n.perm)).map((n) => {
            const active = location.pathname === n.to;
            const Icon = n.icon;
            return (
              <button key={n.to} onClick={() => navigate(n.to)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${active ? 'bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400 font-semibold' : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
                <Icon size={15} /> {n.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => navigate('/trainer/notifications')} className="relative btn-ghost" aria-label="Notifications">
            <Bell size={18} />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-lava-600 text-white text-[10px] flex items-center justify-center">{unread}</span>}
          </button>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="text-sm rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-2 py-1.5 text-ink-700 dark:text-ink-200" aria-label="Active role">
            {managementRoles().map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <button onClick={toggleTheme} className="btn-ghost" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

// Access gate — shows a friendly notice instead of the page when the role lacks a permission.
export function PermissionGate({ permission, children }: { permission: Permission; children: ReactNodeLike }) {
  const { can, role } = useManagement();
  if (can(permission)) return <>{children}</>;
  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <ManagementHeader />
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <ShieldAlert size={32} className="mx-auto text-lava-600 mb-3" />
        <h1 className="section-title text-2xl mb-2">Access restricted</h1>
        <p className="text-ink-500 dark:text-ink-400">Your current role ({role.replace(/_/g, ' ')}) doesn't have the "{permission.replace(/_/g, ' ')}" permission. Switch roles from the header to explore.</p>
      </main>
    </div>
  );
}
type ReactNodeLike = import('react').ReactNode;

export function StatCard({ icon: Icon, label, value, sub, accent = '#8B0000' }: { icon: LucideIcon; label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: accent }}><Icon size={18} /></div>
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100 leading-none">{value}</p>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{label}</p>
        </div>
      </div>
      {sub && <p className="text-xs text-ink-400 mt-2">{sub}</p>}
    </Card>
  );
}

export function InitialsAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="rounded-full gradient-lava text-white flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</div>
  );
}

export function RiskBadge({ atRisk }: { atRisk: boolean }) {
  return atRisk
    ? <span className="badge bg-red-50 dark:bg-red-900/20 text-red-600">At risk</span>
    : <span className="badge bg-green-50 dark:bg-green-900/20 text-green-600">On track</span>;
}

export function ProgressBar({ value, color = '#8B0000' }: { value: number; color?: string }) {
  return (
    <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} className="h-full rounded-full" style={{ background: color }} />
    </div>
  );
}

export function DataTable({ columns, rows, onRowClick }: {
  columns: string[];
  rows: (string | number | ReactNodeLike)[][];
  onRowClick?: (index: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-400 border-b border-ink-100 dark:border-ink-800">
            {columns.map((c) => <th key={c} className="py-2 px-3 font-medium whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} onClick={() => onRowClick?.(i)}
              className={`border-b border-ink-50 dark:border-ink-800/50 ${onRowClick ? 'cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800/40' : ''}`}>
              {r.map((cell, j) => <td key={j} className="py-2.5 px-3 text-ink-700 dark:text-ink-200 whitespace-nowrap">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
