import type { AppNotification, NotificationChannel, NotificationKind, Assignment, LearnerSummary } from '../types';

// A channel adapter delivers a notification. Only in-app is active now; email/SMS/
// Slack are architecture-ready stubs (future integration = implement + register).
export interface NotificationChannelAdapter {
  channel: NotificationChannel;
  enabled: boolean;
  send(n: AppNotification): Promise<boolean>;
}

export const inAppChannel: NotificationChannelAdapter = {
  channel: 'in_app', enabled: true, async send() { return true; },
};
export const emailChannel: NotificationChannelAdapter = {
  channel: 'email', enabled: false, async send() { return false; }, // future
};
export const smsChannel: NotificationChannelAdapter = {
  channel: 'sms', enabled: false, async send() { return false; }, // future
};
export const slackChannel: NotificationChannelAdapter = {
  channel: 'slack', enabled: false, async send() { return false; }, // future
};

export const CHANNELS: NotificationChannelAdapter[] = [inAppChannel, emailChannel, smsChannel, slackChannel];

let seq = 0;
export function createNotification(kind: NotificationKind, title: string, body: string, learnerId?: string): AppNotification {
  return {
    id: `ntf-${Date.now().toString(36)}-${seq++}`,
    kind, title, body, channel: 'in_app',
    createdAt: new Date().toISOString(), read: false, acknowledged: false, learnerId,
  };
}

// Notification Engine — builds the initial feed from platform activity.
export function buildDemoNotifications(roster: LearnerSummary[], assignments: Assignment[]): AppNotification[] {
  const out: AppNotification[] = [];
  const overdue = assignments.filter((a) => new Date(a.dueAt).getTime() < Date.now());
  if (overdue[0]) out.push(createNotification('deadline', 'Assignment overdue', `"${overdue[0].title}" is past its due date.`));
  const topCert = roster.filter((l) => l.certificates > 0).sort((a, b) => b.certificates - a.certificates)[0];
  if (topCert) out.push(createNotification('certificate', 'Certificate earned', `${topCert.name} earned a new certificate.`, topCert.id));
  const risk = roster.filter((l) => l.atRisk);
  if (risk.length) out.push(createNotification('system', 'At-risk learners', `${risk.length} learner(s) may need attention.`));
  const streaker = roster.sort((a, b) => b.streak - a.streak)[0];
  if (streaker) out.push(createNotification('achievement', 'Streak milestone', `${streaker.name} is on a ${streaker.streak}-day streak.`, streaker.id));
  if (assignments[0]) out.push(createNotification('assignment', 'New assignment created', `"${assignments[0].title}" was assigned.`));
  return out;
}

export function unreadCount(list: AppNotification[]): number {
  return list.filter((n) => !n.read).length;
}
