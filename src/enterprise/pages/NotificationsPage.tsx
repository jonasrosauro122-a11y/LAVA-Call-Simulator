import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Mail, MessageSquare, Slack } from 'lucide-react';
import { ManagementHeader, PermissionGate } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useManagement } from '../context/ManagementContext';
import { CHANNELS } from '../engines/notificationEngine';

const KIND_COLOR: Record<string, string> = {
  assignment: '#2563eb', deadline: '#b71c1c', achievement: '#f59e0b',
  certificate: '#16a34a', feedback: '#8B0000', system: '#6b7280',
};

const CHANNEL_ICON = { in_app: Bell, email: Mail, sms: MessageSquare, slack: Slack };

export function NotificationsPage() {
  const { notifications, markRead, markAllRead, acknowledge } = useManagement();

  return (
    <PermissionGate permission="view_learners">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Bell size={22} className="text-lava-600" /><h1 className="section-title text-3xl">Notifications</h1></div>
            <Button size="sm" variant="secondary" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</Button>
          </motion.div>

          {/* Channel availability */}
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Delivery channels</p>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => {
                const Icon = CHANNEL_ICON[c.channel];
                return (
                  <span key={c.channel} className={`badge ${c.enabled ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-ink-100 dark:bg-ink-800 text-ink-400'}`}>
                    <Icon size={12} /> {c.channel.replace('_', '-')} {c.enabled ? '· active' : '· future'}
                  </span>
                );
              })}
            </div>
          </Card>

          <div className="space-y-2">
            {notifications.length === 0 && <Card className="p-8 text-center"><p className="text-sm text-ink-500 dark:text-ink-400">No notifications.</p></Card>}
            {notifications.map((n) => (
              <Card key={n.id} className={`p-4 flex items-center gap-3 ${n.read ? 'opacity-70' : ''}`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: KIND_COLOR[n.kind] ?? '#6b7280' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink-800 dark:text-ink-100">{n.title}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{n.body}</p>
                  <p className="text-[11px] text-ink-400 mt-0.5">{new Date(n.createdAt).toLocaleString()} · {n.kind}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && <button onClick={() => markRead(n.id)} className="btn-ghost text-xs" aria-label="Mark read"><Check size={14} /></button>}
                  {n.kind === 'feedback' && !n.acknowledged && <Button size="sm" variant="ghost" onClick={() => acknowledge(n.id)}>Acknowledge</Button>}
                  {n.acknowledged && <span className="badge bg-green-50 dark:bg-green-900/20 text-green-600">Acknowledged</span>}
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </PermissionGate>
  );
}
