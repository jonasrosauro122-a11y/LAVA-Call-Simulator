// Platform Core Infrastructure — shared primitives. Every service below is an
// isolated singleton; the EventBus is the only shared communication channel so
// services never import one another's implementation. All additive.

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export type Severity = 'info' | 'notice' | 'warning' | 'critical';

// Canonical event names emitted across the platform. Kept as a const list so both
// producers and the admin console share one vocabulary; arbitrary strings are also
// allowed by the bus for forward compatibility.
export const EVENT_TYPES = [
  'LessonCompleted', 'QuizCompleted', 'SimulationCompleted', 'VoiceAnalysisCompleted',
  'CertificateIssued', 'AchievementUnlocked', 'XPAwarded', 'AssignmentCompleted',
  'TrainerFeedbackAdded', 'NotificationCreated', 'CompanyCreated', 'RoleChanged',
  'AIAnalysisCompleted', 'ScenarioGenerated', 'VoiceReplayViewed',
  'JobCompleted', 'JobFailed', 'FeatureFlagChanged', 'ConfigChanged', 'PluginRegistered',
] as const;
export type EventType = typeof EVENT_TYPES[number] | (string & {});
