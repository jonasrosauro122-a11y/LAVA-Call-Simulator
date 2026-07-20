// Voice Recording Storage & Playback — types. Additive layer that reuses the EventBus,
// tenant services, voice analysis, and design system. Every record is tenant-aware.

export type RecordingStatus =
  | 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped'
  | 'uploading' | 'uploaded' | 'error';

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  fileSize: number;
  waveform: number[]; // normalized 0..1 peaks
}

export interface UploadProgress {
  loaded: number;
  total: number;
  pct: number;
  status: 'pending' | 'uploading' | 'done' | 'failed';
  attempt: number;
}

// Mirrors the voice_recordings table (camelCase in app, snake_case in DB via the API).
export interface VoiceRecording {
  id: string;
  tenantId: string;
  learnerId: string;
  simulationId: string;
  moduleId?: string;
  scenarioId?: string;
  provider: string;
  storagePath: string;
  mimeType: string;
  durationSeconds: number;
  fileSize: number;
  transcript?: string;
  summary?: string;
  waveform?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface StorageStats {
  totalRecordings: number;
  totalBytes: number;
  avgDurationSeconds: number;
  uploadFailures: number;
  perTenant: { tenantId: string; recordings: number; bytes: number }[];
}

// Recording lifecycle events published on the platform EventBus.
export const RECORDING_EVENTS = [
  'RecordingStarted', 'RecordingPaused', 'RecordingResumed', 'RecordingStopped',
  'RecordingUploaded', 'RecordingDeleted', 'RecordingPlayed', 'RecordingDownloaded', 'RecordingAnalyzed',
] as const;
export type RecordingEvent = typeof RECORDING_EVENTS[number];
