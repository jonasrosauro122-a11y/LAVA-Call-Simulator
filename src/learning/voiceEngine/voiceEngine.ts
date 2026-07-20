import type { VoiceInput, VoiceAnalysis, VoiceAnalysisMode, LiveCue } from './types';
import { analyzeVoice } from './voiceMetricsEngine';
import { LiveCoachStream } from './liveCoachEngine';
import {
  VoiceProviderRegistry, mockWhisper, mockDeepgram, mockAssemblyAI, mockAzureSpeech,
  mockGoogleSpeech, mockOpenAIRealtime, mockElevenLabs, mockAmazonTranscribe, mockLocalSpeech,
} from './providers/voiceProvider';

// Provider registry (mock only in this stage). Adding a real speech provider =
// implement VoiceProvider + register here. Nothing else changes.
export const voiceRegistry = new VoiceProviderRegistry();
voiceRegistry.register(mockWhisper, { makeDefault: true });
voiceRegistry.register(mockDeepgram);
voiceRegistry.register(mockAssemblyAI);
voiceRegistry.register(mockAzureSpeech);
voiceRegistry.register(mockGoogleSpeech);
voiceRegistry.register(mockOpenAIRealtime);
voiceRegistry.register(mockElevenLabs);
voiceRegistry.register(mockAmazonTranscribe);
voiceRegistry.register(mockLocalSpeech);

export interface StreamHandlers {
  onCue?: (cue: LiveCue) => void;
  onPartial?: (analysis: VoiceAnalysis) => void;
  baselineScore?: number;
}

// A streaming session for near-real-time / live modes. Business logic pushes
// transcript chunks; the session emits standardized VoiceAnalysis + LiveCue
// objects — identical to what offline mode returns.
export class VoiceStreamSession {
  private transcript = '';
  private elapsed = 0;
  private coach: LiveCoachStream;

  constructor(
    private mode: VoiceAnalysisMode,
    private simulationId: string,
    private moduleName: string,
    private handlers: StreamHandlers = {},
  ) {
    this.coach = new LiveCoachStream((cue) => this.handlers.onCue?.(cue));
    this.coach.start();
  }

  pushChunk(text: string, atSec: number): void {
    this.transcript += ` ${text}`;
    this.elapsed = Math.max(this.elapsed, atSec);
    this.coach.pushChunk(text, atSec);
    if (this.handlers.onPartial) this.handlers.onPartial(this.snapshot());
  }

  private buildInput(): VoiceInput {
    const t = this.transcript.trim();
    return {
      simulationId: this.simulationId,
      transcript: t,
      words: t ? t.split(/\s+/).filter(Boolean).length : 0,
      wpm: null,
      durationSeconds: Math.max(1, Math.round(this.elapsed)),
      categoryScores: {},
      overallScore: this.handlers.baselineScore ?? 0,
      turns: [],
      emotionTimeline: [],
    };
  }

  snapshot(): VoiceAnalysis {
    const provider = voiceRegistry.selectForMode(this.mode) ?? voiceRegistry.getDefault();
    return analyzeVoice(this.buildInput(), { mode: this.mode, provider: provider?.metadata.id, moduleName: this.moduleName });
  }

  complete(): VoiceAnalysis {
    this.coach.stop();
    return this.snapshot();
  }
}

// Single entry point. The caller passes a mode; the return type is always VoiceAnalysis.
export const voiceEngine = {
  // Offline: analyze a completed session.
  analyze(input: VoiceInput, mode: VoiceAnalysisMode = 'offline', moduleName?: string): VoiceAnalysis {
    const provider = voiceRegistry.selectForMode(mode) ?? voiceRegistry.getDefault();
    if (provider) return provider.analyze(input, mode);
    return analyzeVoice(input, { mode, moduleName });
  },
  // Near-real-time / live: get a streaming session.
  createSession(mode: VoiceAnalysisMode, simulationId: string, moduleName: string, handlers?: StreamHandlers): VoiceStreamSession {
    return new VoiceStreamSession(mode, simulationId, moduleName, handlers);
  },
};
