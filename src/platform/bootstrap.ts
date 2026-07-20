import { auditService } from './auditService';
import { webhooks } from './webhookService';
import { featureFlags } from './featureFlagService';
import { jobQueue } from './jobQueue';
import { scheduler } from './scheduler';
import { integrations } from './integrationService';
import { plugins } from './pluginRegistry';

let started = false;

// Default feature flags (Feature 3 examples). Default = enabled for shipped features.
const DEFAULT_FLAGS = [
  ['voice_intelligence', 'Voice Intelligence', true],
  ['ai_coach', 'AI Coach', true],
  ['trainer_dashboard', 'Trainer Dashboard', true],
  ['certificates', 'Certificates', true],
  ['leaderboards', 'Leaderboards', true],
  ['scenario_engine', 'Scenario Engine', true],
  ['enterprise_dashboard', 'Enterprise Dashboard', true],
  ['realtime_voice', 'Realtime Voice', false],
  ['future_plugins', 'Future Plugins', false],
] as const;

// Built-in plugin manifests demonstrating self-registration for each plugin kind.
const BUILTIN_PLUGINS = [
  { id: 'core-ai-mock', kind: 'ai_provider' as const, name: 'Mock AI Provider', version: '1.0.0' },
  { id: 'core-voice-whisper', kind: 'voice_provider' as const, name: 'Whisper (mock)', version: '1.0.0' },
  { id: 'core-scenarios', kind: 'scenario_pack' as const, name: 'Core Scenario Pack', version: '1.0.0' },
  { id: 'core-export-csv', kind: 'export_provider' as const, name: 'CSV Export', version: '1.0.0' },
  { id: 'core-notify-inapp', kind: 'notification_provider' as const, name: 'In-App Notifications', version: '1.0.0' },
];

// Background job runners (Feature 6 examples). Deterministic no-op work for now.
const JOB_RUNNERS: [string, () => Promise<unknown>][] = [
  ['certificate.generate', async () => ({ generated: true })],
  ['voice.analyze', async () => ({ analyzed: true })],
  ['report.build', async () => ({ rows: 0 })],
  ['email.send', async () => ({ sent: true })],
  ['notification.deliver', async () => ({ delivered: true })],
  ['leaderboard.refresh', async () => ({ refreshed: true })],
  ['data.sync', async () => ({ synced: true })],
];

// Scheduled tasks (Feature 7 examples) with cron-like expressions.
const SCHEDULES: [string, string, string][] = [
  ['Daily Challenges', '0 0 * * *', 'notification.deliver'],
  ['Weekly Leaderboard', '0 0 * * 1', 'leaderboard.refresh'],
  ['Monthly Reports', '0 0 1 * *', 'report.build'],
  ['Cleanup Job', '0 3 * * *', 'data.sync'],
  ['Reminder Notifications', '0 9 * * *', 'notification.deliver'],
  ['Certificate Validation', '0 2 * * *', 'certificate.generate'],
];

// Planned external integrations (Feature 9) — architecture/catalog only.
const INTEGRATIONS: [string, string, string, string[]][] = [
  ['salesforce', 'Salesforce', 'crm', ['contacts', 'opportunities']],
  ['hubspot', 'HubSpot', 'crm', ['contacts', 'deals']],
  ['zoho', 'Zoho', 'crm', ['leads']],
  ['google-workspace', 'Google Workspace', 'productivity', ['calendar', 'drive']],
  ['microsoft-365', 'Microsoft 365', 'productivity', ['calendar', 'teams']],
  ['slack', 'Slack', 'comms', ['messages', 'webhooks']],
  ['teams', 'Microsoft Teams', 'comms', ['messages']],
  ['zoom', 'Zoom', 'meeting', ['meetings', 'recordings']],
  ['calendly', 'Calendly', 'calendar', ['scheduling']],
  ['servicechannel', 'ServiceChannel', 'lms', ['work-orders']],
  ['qq-catalyst', 'QQ Catalyst', 'insurance', ['policies']],
  ['applied-epic', 'Applied Epic', 'insurance', ['policies', 'clients']],
  ['ezlynx', 'EZLynx', 'insurance', ['quotes', 'policies']],
  ['hawksoft', 'HawkSoft', 'insurance', ['clients', 'policies']],
];

/** Idempotently wire and seed all platform services. Safe to call more than once. */
export function initPlatform(): void {
  if (started) return;
  started = true;

  auditService.bindToEventBus();
  webhooks.bindToEventBus();

  DEFAULT_FLAGS.forEach(([id, label, def]) => featureFlags.register({ id, label, default: def, rules: [] }));
  BUILTIN_PLUGINS.forEach((p) => plugins.register(p));
  JOB_RUNNERS.forEach(([type, runner]) => jobQueue.register(type, runner));
  SCHEDULES.forEach(([name, cron, jobType]) => scheduler.schedule(name, cron, { jobType }));
  INTEGRATIONS.forEach(([id, name, category, capabilities]) =>
    integrations.define({ id, name, category: category as never, description: `${name} integration`, capabilities, available: false }));
}
