import type { VoiceInput, VoiceAnalysis, VoiceAnalysisMode } from './types';
import { clamp } from './extract';
import { analyzeSpeech } from './speechAnalyzer';
import { analyzeFluency } from './fluencyAnalyzer';
import { analyzePace, effectiveWpm } from './paceAnalyzer';
import { analyzePronunciation } from './pronunciationAnalyzer';
import { analyzeFillers } from './fillerWordAnalyzer';
import { analyzeSilence } from './silenceAnalyzer';
import { analyzeInterruptions } from './interruptionAnalyzer';
import { analyzeConfidence } from './confidenceAnalyzer';
import { analyzeToneEnergy } from './toneAnalyzer';
import { analyzeActiveListening } from './activeListeningAnalyzer';
import { analyzeConversationFlow } from './conversationFlowAnalyzer';
import { buildSpeechTimeline } from './speechTimelineEngine';
import { generateCues } from './liveCoachEngine';
import { recommendVoiceCoaching } from './voiceRecommendationEngine';

export interface VoiceAnalysisContext {
  mode?: VoiceAnalysisMode;
  provider?: string;
  moduleName?: string;
  createdAt?: string;
}

// The single orchestrator. Every mode (offline/near-real-time/live) ultimately
// produces a VoiceAnalysis through here, guaranteeing one standardized shape.
export function analyzeVoice(input: VoiceInput, ctx: VoiceAnalysisContext = {}): VoiceAnalysis {
  const fillers = analyzeFillers(input);
  const speech = analyzeSpeech(input);
  const fluency = analyzeFluency(input, fillers);
  speech.fluency = fluency;
  const pronunciation = analyzePronunciation(input);
  const silence = analyzeSilence(input, fillers);
  const interruptions = analyzeInterruptions(input);
  const confidence = analyzeConfidence(input, fillers);
  const toneEnergy = analyzeToneEnergy(input);
  const pace = analyzePace(input);
  const activeListening = analyzeActiveListening(input, speech);
  const flow = analyzeConversationFlow(interruptions, silence, fillers);

  const wpm = effectiveWpm(input);
  const paceScore = clamp(100 - Math.min(100, Math.abs(wpm - 145) * 0.8));
  const fillerScore = clamp(100 - fillers.perMinute * 8);

  const overallVoiceScore = clamp(
    confidence.confidence * 0.22 +
    fluency * 0.14 +
    pronunciation.overall * 0.14 +
    paceScore * 0.1 +
    fillerScore * 0.1 +
    activeListening * 0.1 +
    ((toneEnergy.professional + toneEnergy.friendly) / 2) * 0.1 +
    flow * 0.1,
  );

  const partial: VoiceAnalysis = {
    simulationId: input.simulationId,
    mode: ctx.mode ?? 'offline',
    provider: ctx.provider ?? 'mock-whisper',
    createdAt: ctx.createdAt ?? new Date().toISOString(),
    durationSeconds: input.durationSeconds,
    moduleName: ctx.moduleName ?? 'Simulation',
    overallVoiceScore,
    speech,
    pronunciation,
    fillers,
    silence,
    interruptions,
    confidence,
    toneEnergy,
    pace,
    timeline: buildSpeechTimeline({ input, confidence, fillers, silence, interruptions, toneEnergy }),
    liveCues: generateCues({ input, speech, fillers, confidence, interruptions, toneEnergy }),
    recommendations: [],
  };
  partial.recommendations = recommendVoiceCoaching(partial);
  return partial;
}
