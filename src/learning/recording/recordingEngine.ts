import { eventBus } from '../../platform/eventBus';
import { metrics } from '../../production/observability';
import type { RecordingStatus, RecordingResult } from './types';

// RecordingEngine — wraps MediaRecorder + an AnalyserNode for live waveform peaks. Handles
// permission, device selection, start/pause/resume/stop/cancel, blob + duration generation,
// and error handling. Browser-only APIs are guarded so the module imports safely anywhere.

const PREFERRED_MIME = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  return PREFERRED_MIME.find((m) => MediaRecorder.isTypeSupported(m)) ?? 'audio/webm';
}

export interface RecordingDevice { deviceId: string; label: string; }

export class RecordingEngine {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private status: RecordingStatus = 'idle';
  private startedAt = 0;
  private pausedTotal = 0;
  private pausedAt = 0;
  private mime = 'audio/webm';
  private waveform: number[] = [];
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private waveTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(s: RecordingStatus) => void>();
  private simulationId: string;

  constructor(simulationId: string) { this.simulationId = simulationId; }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  }

  getStatus(): RecordingStatus { return this.status; }
  getWaveform(): number[] { return this.waveform; }
  onStatus(cb: (s: RecordingStatus) => void): () => void { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  private set(status: RecordingStatus): void { this.status = status; this.listeners.forEach((l) => l(status)); }

  async listDevices(): Promise<RecordingDevice[]> {
    if (!this.isSupported()) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput').map((d) => ({ deviceId: d.deviceId, label: d.label || 'Microphone' }));
    } catch { return []; }
  }

  async start(deviceId?: string): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isSupported()) return { ok: false, reason: 'Recording not supported in this browser' };
    if (this.status === 'recording') return { ok: true };
    this.set('requesting');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
    } catch (err) {
      this.set('error');
      return { ok: false, reason: err instanceof Error ? err.message : 'Microphone permission denied' };
    }
    this.mime = pickMime();
    this.chunks = []; this.waveform = []; this.pausedTotal = 0;
    try {
      this.recorder = new MediaRecorder(this.stream, { mimeType: this.mime, audioBitsPerSecond: 64000 });
    } catch {
      this.recorder = new MediaRecorder(this.stream);
      this.mime = this.recorder.mimeType || 'audio/webm';
    }
    this.recorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
    this.recorder.start(1000);
    this.startedAt = Date.now();
    this.setupWaveform();
    this.set('recording');
    void eventBus.publish('RecordingStarted', { simulationId: this.simulationId, mime: this.mime }, { source: 'recording' });
    metrics.increment('recording.started');
    return { ok: true };
  }

  private setupWaveform(): void {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AC();
      const source = this.audioCtx.createMediaStreamSource(this.stream!);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.waveTimer = setInterval(() => {
        if (!this.analyser || this.status !== 'recording') return;
        this.analyser.getByteTimeDomainData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        this.waveform.push(Math.min(1, Math.sqrt(sum / data.length) * 2.5));
        if (this.waveform.length > 600) this.waveform.shift();
      }, 100);
    } catch { /* waveform is best-effort */ }
  }

  pause(): void {
    if (this.recorder && this.status === 'recording') {
      this.recorder.pause(); this.pausedAt = Date.now(); this.set('paused');
      void eventBus.publish('RecordingPaused', { simulationId: this.simulationId }, { source: 'recording' });
    }
  }
  resume(): void {
    if (this.recorder && this.status === 'paused') {
      this.pausedTotal += Date.now() - this.pausedAt; this.recorder.resume(); this.set('recording');
      void eventBus.publish('RecordingResumed', { simulationId: this.simulationId }, { source: 'recording' });
    }
  }

  durationSeconds(): number {
    if (!this.startedAt) return 0;
    const end = this.status === 'paused' ? this.pausedAt : Date.now();
    return Math.max(0, (end - this.startedAt - this.pausedTotal) / 1000);
  }

  async stop(): Promise<RecordingResult | null> {
    if (!this.recorder || (this.status !== 'recording' && this.status !== 'paused')) return null;
    const duration = this.durationSeconds();
    const result = await new Promise<RecordingResult>((resolve) => {
      this.recorder!.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mime });
        resolve({ blob, mimeType: this.mime, durationSeconds: Math.round(duration), fileSize: blob.size, waveform: [...this.waveform] });
      };
      this.recorder!.stop();
    });
    this.teardown();
    this.set('stopped');
    void eventBus.publish('RecordingStopped', { simulationId: this.simulationId, durationSeconds: result.durationSeconds, fileSize: result.fileSize }, { source: 'recording' });
    metrics.gauge('recording.lastDurationSec', result.durationSeconds);
    return result;
  }

  cancel(): void {
    if (this.recorder && this.status !== 'idle') { try { this.recorder.stop(); } catch { /* ignore */ } }
    this.teardown();
    this.set('idle');
  }

  private teardown(): void {
    if (this.waveTimer) { clearInterval(this.waveTimer); this.waveTimer = null; }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioCtx?.close().catch(() => undefined);
    this.stream = null; this.recorder = null; this.audioCtx = null; this.analyser = null;
  }
}
