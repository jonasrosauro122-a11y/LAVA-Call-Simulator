import type { VoiceInput, SpeechMetrics } from './types';
import { clamp } from './extract';
import { effectiveWpm } from './paceAnalyzer';

function speed(wpm: number): SpeechMetrics['speakingSpeed'] {
  if (wpm < 100) return 'Slow';
  if (wpm < 120) return 'Measured';
  if (wpm <= 160) return 'Ideal';
  if (wpm <= 185) return 'Fast';
  return 'Very Fast';
}

// Feature 1 — speech intelligence metrics.
export function analyzeSpeech(input: VoiceInput): SpeechMetrics {
  const wpm = effectiveWpm(input);
  const sentences = Math.max(1, (input.transcript.match(/[.!?]+/g) ?? []).length);
  const avgSentenceLength = Math.round(input.words / sentences);

  // Learner talk time from words / wpm; the rest of the call is the AI/customer.
  const talkTimeSec = Math.round((input.words / Math.max(wpm, 1)) * 60);
  const customerTalkTimeSec = Math.max(0, input.durationSeconds - talkTimeSec);
  const learnerTurns = input.turns.filter((t) => t.role === 'learner').length || 1;

  const listeningRatio = clamp((customerTalkTimeSec / Math.max(input.durationSeconds, 1)) * 100);
  const balance: SpeechMetrics['conversationBalance'] =
    listeningRatio > 65 ? 'Learner-passive' : listeningRatio < 35 ? 'Learner-dominant' : 'Balanced';

  const fluency = clamp(input.categoryScores['Fluency'] ?? input.categoryScores['Communication'] ?? input.overallScore);

  return {
    wpm,
    speakingSpeed: speed(wpm),
    avgSentenceLength,
    avgResponseTimeSec: Number((input.durationSeconds / (learnerTurns + 1)).toFixed(1)),
    thinkingTimeSec: Math.round(Math.min(input.durationSeconds * 0.12, learnerTurns * 2.2)),
    talkTimeSec,
    aiTalkTimeSec: customerTalkTimeSec,
    customerTalkTimeSec,
    listeningRatio,
    conversationBalance: balance,
    fluency,
  };
}
