import { supabase } from '../../lib/supabase';
import { eventBus } from '../../platform/eventBus';
import { metrics } from '../../production/observability';
import { TTLCache } from '../../production/performance';
import { isAtLeast } from '../../enterprise/roles/roleEngine';
import type { Role } from '../../enterprise/types';
import type { TenantContext } from '../../tenant/types';
import type { VoiceRecording, UploadProgress, StorageStats } from './types';

export const BUCKET = 'voice-recordings';

// Signed URLs are cached below their expiry so we never re-sign on every play.
const urlCache = new TTLCache<string>(50 * 60 * 1000); // 50 min (URLs signed for 60)

// Local fallback: keeps blobs (as object URLs) + metadata in-memory so the full record →
// upload → playback → review flow works without a configured Supabase backend. The
// production path (storage.upload + createSignedUrl) is used automatically when available.
const localBlobs = new Map<string, string>(); // storagePath -> objectURL
const localMeta = new Map<string, VoiceRecording>(); // id -> recording
let uploadFailures = 0;

function pad(n: number): string { return String(n).padStart(2, '0'); }

// tenant_id/learner_id/yyyy/mm/simulation_id.webm — never exposed directly (signed only).
export function buildPath(ctx: TenantContext, learnerId: string, simulationId: string, ext = 'webm'): string {
  const d = new Date();
  return `${ctx.tenantId}/${learnerId}/${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${simulationId}.${ext}`;
}

function toRow(r: VoiceRecording) {
  return {
    tenant_id: ctxIsUuid(r.tenantId) ? r.tenantId : null,
    learner_id: r.learnerId, simulation_id: r.simulationId, module_id: r.moduleId ?? null,
    scenario_id: r.scenarioId ?? null, provider: r.provider, storage_path: r.storagePath,
    mime_type: r.mimeType, duration_seconds: r.durationSeconds, file_size: r.fileSize,
    transcript: r.transcript ?? null, summary: r.summary ?? null,
  };
}
function ctxIsUuid(id: string): boolean { return /^[0-9a-f-]{36}$/i.test(id); }

export async function saveMetadata(_ctx: TenantContext, rec: VoiceRecording): Promise<void> {
  localMeta.set(rec.id, rec);
  try { await supabase.from('voice_recordings').upsert(toRow(rec), { onConflict: 'tenant_id,simulation_id' }); }
  catch { /* offline-tolerant; local copy retained */ }
}

export interface UploadParams {
  learnerId: string; simulationId: string; moduleId?: string; scenarioId?: string;
  provider: string; blob: Blob; mimeType: string; durationSeconds: number;
  waveform?: number[]; transcript?: string;
}

export async function uploadRecording(
  ctx: TenantContext, params: UploadParams, onProgress?: (p: UploadProgress) => void,
): Promise<VoiceRecording> {
  const storagePath = buildPath(ctx, params.learnerId, params.simulationId);
  const total = params.blob.size;
  const report = (pct: number, status: UploadProgress['status'], attempt: number) =>
    onProgress?.({ loaded: Math.round((pct / 100) * total), total, pct, status, attempt });

  const maxAttempts = 3;
  let uploaded = false;
  for (let attempt = 1; attempt <= maxAttempts && !uploaded; attempt++) {
    report(10, 'uploading', attempt);
    try {
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, params.blob, {
        contentType: params.mimeType, upsert: true,
      });
      if (error) throw error;
      uploaded = true;
      report(100, 'done', attempt);
    } catch {
      if (attempt >= maxAttempts) {
        // Fallback: keep the blob locally so playback still works this session.
        localBlobs.set(storagePath, URL.createObjectURL(params.blob));
        uploadFailures++;
        metrics.increment('recording.uploadFailures');
        report(100, 'done', attempt);
      } else {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }

  const now = new Date().toISOString();
  const rec: VoiceRecording = {
    id: `rec-${params.simulationId}`, tenantId: ctx.tenantId, learnerId: params.learnerId,
    simulationId: params.simulationId, moduleId: params.moduleId, scenarioId: params.scenarioId,
    provider: params.provider, storagePath, mimeType: params.mimeType,
    durationSeconds: params.durationSeconds, fileSize: total, transcript: params.transcript,
    waveform: params.waveform, createdAt: now, updatedAt: now,
  };
  await saveMetadata(ctx, rec);
  metrics.increment('recording.uploaded');
  void eventBus.publish('RecordingUploaded', { simulationId: rec.simulationId, tenantId: ctx.tenantId, fileSize: total }, { source: 'recording', metadata: { target: ctx.tenantId, actor: params.learnerId } });
  return rec;
}

export async function getSignedUrl(_ctx: TenantContext, rec: VoiceRecording, expiresSec = 3600): Promise<string | null> {
  const cached = urlCache.get(rec.storagePath);
  if (cached) return cached;
  const local = localBlobs.get(rec.storagePath);
  if (local) { urlCache.set(rec.storagePath, local); return local; }
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(rec.storagePath, expiresSec);
    if (error || !data?.signedUrl) return null;
    urlCache.set(rec.storagePath, data.signedUrl);
    return data.signedUrl;
  } catch { return null; }
}

export async function listRecordings(ctx: TenantContext, opts: { learnerId?: string } = {}): Promise<VoiceRecording[]> {
  const locals = [...localMeta.values()].filter((r) => r.tenantId === ctx.tenantId && (!opts.learnerId || r.learnerId === opts.learnerId));
  try {
    let q = supabase.from('voice_recordings').select('*').order('created_at', { ascending: false });
    if (opts.learnerId) q = q.eq('learner_id', opts.learnerId);
    const { data } = await q;
    const rows = (data as unknown as Record<string, unknown>[] | null) ?? [];
    if (rows.length) {
      const mapped = rows.map(fromRow);
      const merged = new Map(mapped.map((r) => [r.simulationId, r]));
      for (const l of locals) if (!merged.has(l.simulationId)) merged.set(l.simulationId, l);
      return [...merged.values()];
    }
  } catch { /* fall through to local */ }
  return locals.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function fromRow(r: Record<string, unknown>): VoiceRecording {
  return {
    id: String(r.id), tenantId: String(r.tenant_id ?? ''), learnerId: String(r.learner_id),
    simulationId: String(r.simulation_id), moduleId: r.module_id ? String(r.module_id) : undefined,
    scenarioId: r.scenario_id ? String(r.scenario_id) : undefined, provider: String(r.provider ?? ''),
    storagePath: String(r.storage_path), mimeType: String(r.mime_type ?? 'audio/webm'),
    durationSeconds: Number(r.duration_seconds ?? 0), fileSize: Number(r.file_size ?? 0),
    transcript: r.transcript ? String(r.transcript) : undefined, summary: r.summary ? String(r.summary) : undefined,
    createdAt: String(r.created_at ?? new Date().toISOString()), updatedAt: String(r.updated_at ?? new Date().toISOString()),
  };
}

export async function getRecording(ctx: TenantContext, simulationId: string): Promise<VoiceRecording | null> {
  const all = await listRecordings(ctx);
  return all.find((r) => r.simulationId === simulationId) ?? null;
}

export async function updateTranscript(ctx: TenantContext, rec: VoiceRecording, transcript: string, summary?: string): Promise<void> {
  const updated = { ...rec, transcript, summary: summary ?? rec.summary, updatedAt: new Date().toISOString() };
  await saveMetadata(ctx, updated);
  void eventBus.publish('RecordingAnalyzed', { simulationId: rec.simulationId }, { source: 'recording' });
}

export async function deleteRecording(ctx: TenantContext, rec: VoiceRecording): Promise<void> {
  localMeta.delete(rec.id);
  const obj = localBlobs.get(rec.storagePath);
  if (obj) { URL.revokeObjectURL(obj); localBlobs.delete(rec.storagePath); }
  urlCache.clear();
  try { await supabase.storage.from(BUCKET).remove([rec.storagePath]); await supabase.from('voice_recordings').delete().eq('id', rec.id); }
  catch { /* offline-tolerant */ }
  void eventBus.publish('RecordingDeleted', { simulationId: rec.simulationId, tenantId: ctx.tenantId }, { source: 'recording', metadata: { target: ctx.tenantId } });
}

// Security: only the owner or a management role (trainer+) may access a recording.
export function canAccessRecording(role: Role, ownerLearnerId: string, viewerLearnerId: string): boolean {
  return ownerLearnerId === viewerLearnerId || isAtLeast(role, 'trainer');
}

export async function storageStats(): Promise<StorageStats> {
  const all = [...localMeta.values()];
  try {
    const { data } = await supabase.from('voice_recordings').select('*');
    const rows = (data as unknown as Record<string, unknown>[] | null) ?? [];
    for (const row of rows.map(fromRow)) if (!all.some((r) => r.id === row.id)) all.push(row);
  } catch { /* local only */ }
  const perTenantMap = new Map<string, { recordings: number; bytes: number }>();
  let bytes = 0, durSum = 0;
  for (const r of all) {
    bytes += r.fileSize; durSum += r.durationSeconds;
    const t = perTenantMap.get(r.tenantId) ?? { recordings: 0, bytes: 0 };
    t.recordings++; t.bytes += r.fileSize; perTenantMap.set(r.tenantId, t);
  }
  return {
    totalRecordings: all.length, totalBytes: bytes,
    avgDurationSeconds: all.length ? Math.round(durSum / all.length) : 0,
    uploadFailures,
    perTenant: [...perTenantMap.entries()].map(([tenantId, v]) => ({ tenantId, ...v })),
  };
}

export function markPlayed(simulationId: string): void {
  void eventBus.publish('RecordingPlayed', { simulationId }, { source: 'recording' });
  metrics.increment('recording.played');
}
export function markDownloaded(simulationId: string): void {
  void eventBus.publish('RecordingDownloaded', { simulationId }, { source: 'recording' });
}
