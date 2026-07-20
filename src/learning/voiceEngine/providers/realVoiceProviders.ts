import type { VoiceProvider, VoiceProviderMetadata, VoiceInput, VoiceAnalysis, VoiceAnalysisMode } from '../types';
import { analyzeVoice } from '../voiceMetricsEngine';
import { environment } from '../../../production/environment';
import { metrics } from '../../../production/observability';

// Real voice adapters (Phase 5). Same VoiceProvider interface as the mocks. A concrete
// provider's only job is audio → VoiceInput (transcription/diarization); the analysis is
// shared, so output shape never changes. Keys come from the environment; without them the
// adapter returns the shared deterministic analysis (offline-tolerant).

function realVoiceMetadata(over: Partial<VoiceProviderMetadata> & Pick<VoiceProviderMetadata, 'id' | 'name' | 'engine'>): VoiceProviderMetadata {
  return { supportsStreaming: true, supportsRealtime: false, supportsDiarization: true, latencyEstimateMs: 300, estimatedCostPerMinute: 0.005, availability: 'available', local: false, ...over };
}

function createRealVoiceProvider(metadata: VoiceProviderMetadata, keyEnv: string): VoiceProvider {
  return {
    metadata,
    supports(mode: VoiceAnalysisMode) {
      if (mode === 'live') return metadata.supportsRealtime;
      if (mode === 'near_realtime') return metadata.supportsStreaming;
      return true;
    },
    isAvailable() { return environment.has(keyEnv); },
    analyze(input: VoiceInput, mode: VoiceAnalysisMode): VoiceAnalysis {
      metrics.setProvider(metadata.id, environment.has(keyEnv) ? 'operational' : 'not_configured');
      // A configured provider transcribes audio→VoiceInput here; analysis is shared below.
      return analyzeVoice(input, { mode, provider: metadata.id });
    },
  };
}

export const deepgramProvider = createRealVoiceProvider(
  realVoiceMetadata({ id: 'deepgram', name: 'Deepgram', engine: 'nova-2', supportsRealtime: true, latencyEstimateMs: 250, estimatedCostPerMinute: 0.0043 }), 'DEEPGRAM_API_KEY');
export const whisperProvider = createRealVoiceProvider(
  realVoiceMetadata({ id: 'whisper', name: 'OpenAI Whisper', engine: 'whisper-large-v3', supportsRealtime: false, estimatedCostPerMinute: 0.006 }), 'OPENAI_API_KEY');
export const elevenLabsProvider = createRealVoiceProvider(
  realVoiceMetadata({ id: 'elevenlabs', name: 'ElevenLabs', engine: 'scribe-v1', supportsRealtime: true, estimatedCostPerMinute: 0.008 }), 'ELEVENLABS_API_KEY');

export const REAL_VOICE_PROVIDERS: VoiceProvider[] = [deepgramProvider, whisperProvider, elevenLabsProvider];

// ---- Audio capture (mic permissions, device selection, noise detection, upload) ----
export interface AudioDevice { deviceId: string; label: string; }

export const audioCapture = {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  },
  async requestPermission(): Promise<{ granted: boolean; reason?: string }> {
    if (!this.isSupported()) return { granted: false, reason: 'MediaDevices API unavailable' };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return { granted: true };
    } catch (err) { return { granted: false, reason: err instanceof Error ? err.message : 'denied' }; }
  },
  async listDevices(): Promise<AudioDevice[]> {
    if (!this.isSupported()) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput').map((d) => ({ deviceId: d.deviceId, label: d.label || 'Microphone' }));
    } catch { return []; }
  },
  // Simple RMS-based noise/level estimate from a Float32 frame (0..1).
  noiseLevel(frame: Float32Array): number {
    if (!frame.length) return 0;
    let sum = 0; for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    return Math.min(1, Math.sqrt(sum / frame.length) * 4);
  },
  acceptsUpload(file: { type: string; size: number }): { ok: boolean; reason?: string } {
    if (!/^audio\//.test(file.type)) return { ok: false, reason: 'Not an audio file' };
    if (file.size > 50 * 1024 * 1024) return { ok: false, reason: 'File exceeds 50MB' };
    return { ok: true };
  },
};
