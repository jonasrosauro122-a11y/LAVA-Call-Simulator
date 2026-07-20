import type { VoiceProvider, VoiceProviderMetadata, VoiceInput, VoiceAnalysis, VoiceAnalysisMode } from '../types';
import { analyzeVoice } from '../voiceMetricsEngine';

// A concrete provider only needs to turn audio → VoiceInput (transcription/diarization).
// The analysis itself is shared, so every provider returns the same VoiceAnalysis.
export function createVoiceProvider(metadata: VoiceProviderMetadata): VoiceProvider {
  return {
    metadata,
    supports(mode: VoiceAnalysisMode) {
      if (mode === 'live') return metadata.supportsRealtime;
      if (mode === 'near_realtime') return metadata.supportsStreaming;
      return true; // offline supported by all
    },
    isAvailable() {
      return metadata.availability !== 'offline';
    },
    analyze(input: VoiceInput, mode: VoiceAnalysisMode): VoiceAnalysis {
      return analyzeVoice(input, { mode, provider: metadata.id });
    },
  };
}

const M = (over: Partial<VoiceProviderMetadata> & Pick<VoiceProviderMetadata, 'id' | 'name' | 'engine'>): VoiceProviderMetadata => ({
  supportsStreaming: false, supportsRealtime: false, supportsDiarization: false,
  latencyEstimateMs: 800, estimatedCostPerMinute: 0, availability: 'available', local: false, ...over,
});

// Mock providers mirroring the speech engines named in the spec.
export const mockWhisper = createVoiceProvider(M({ id: 'mock-whisper', name: 'Whisper (mock)', engine: 'whisper-large-v3', supportsDiarization: false, estimatedCostPerMinute: 0.006, latencyEstimateMs: 1500 }));
export const mockDeepgram = createVoiceProvider(M({ id: 'mock-deepgram', name: 'Deepgram (mock)', engine: 'nova-2', supportsStreaming: true, supportsRealtime: true, supportsDiarization: true, estimatedCostPerMinute: 0.0043, latencyEstimateMs: 250 }));
export const mockAssemblyAI = createVoiceProvider(M({ id: 'mock-assemblyai', name: 'AssemblyAI (mock)', engine: 'universal-2', supportsStreaming: true, supportsDiarization: true, estimatedCostPerMinute: 0.0037, latencyEstimateMs: 600 }));
export const mockAzureSpeech = createVoiceProvider(M({ id: 'mock-azure', name: 'Azure Speech (mock)', engine: 'azure-stt', supportsStreaming: true, supportsRealtime: true, supportsDiarization: true, estimatedCostPerMinute: 0.0167, latencyEstimateMs: 400 }));
export const mockGoogleSpeech = createVoiceProvider(M({ id: 'mock-google', name: 'Google Speech (mock)', engine: 'chirp-2', supportsStreaming: true, supportsRealtime: true, supportsDiarization: true, estimatedCostPerMinute: 0.016, latencyEstimateMs: 450 }));
export const mockOpenAIRealtime = createVoiceProvider(M({ id: 'mock-openai-realtime', name: 'OpenAI Realtime (mock)', engine: 'gpt-4o-realtime', supportsStreaming: true, supportsRealtime: true, supportsDiarization: false, estimatedCostPerMinute: 0.06, latencyEstimateMs: 320 }));
export const mockElevenLabs = createVoiceProvider(M({ id: 'mock-elevenlabs', name: 'ElevenLabs (mock)', engine: 'scribe-v1', supportsStreaming: true, supportsRealtime: false, estimatedCostPerMinute: 0.004, latencyEstimateMs: 700 }));
export const mockAmazonTranscribe = createVoiceProvider(M({ id: 'mock-amazon', name: 'Amazon Transcribe (mock)', engine: 'transcribe', supportsStreaming: true, supportsDiarization: true, estimatedCostPerMinute: 0.024, latencyEstimateMs: 900 }));
export const mockLocalSpeech = createVoiceProvider(M({ id: 'mock-local', name: 'Local Speech (mock)', engine: 'vosk', supportsStreaming: true, local: true, estimatedCostPerMinute: 0, latencyEstimateMs: 1100 }));

export class VoiceProviderRegistry {
  private providers = new Map<string, VoiceProvider>();
  private enabled = new Set<string>();
  private defaultId: string | null = null;

  register(p: VoiceProvider, opts: { enable?: boolean; makeDefault?: boolean } = {}): void {
    this.providers.set(p.metadata.id, p);
    if (opts.enable !== false) this.enabled.add(p.metadata.id);
    if (opts.makeDefault || this.defaultId === null) this.defaultId = p.metadata.id;
  }
  get(id: string): VoiceProvider | undefined { return this.providers.get(id); }
  all(): VoiceProvider[] { return [...this.providers.values()]; }
  enabledProviders(): VoiceProvider[] { return this.all().filter((p) => this.enabled.has(p.metadata.id)); }
  isEnabled(id: string): boolean { return this.enabled.has(id); }
  enable(id: string): void { if (this.providers.has(id)) this.enabled.add(id); }
  disable(id: string): void { this.enabled.delete(id); }
  setDefault(id: string): void { if (this.providers.has(id)) this.defaultId = id; }
  getDefaultId(): string | null { return this.defaultId; }
  getDefault(): VoiceProvider | null { return this.defaultId ? this.providers.get(this.defaultId) ?? null : null; }

  // Pick the best enabled provider for a mode (prefers the default when it supports it).
  selectForMode(mode: VoiceAnalysisMode): VoiceProvider | null {
    const enabled = this.enabledProviders().filter((p) => p.supports(mode) && p.isAvailable());
    if (!enabled.length) return null;
    const def = this.getDefault();
    if (def && enabled.some((p) => p.metadata.id === def.metadata.id)) return def;
    return enabled[0];
  }
}
