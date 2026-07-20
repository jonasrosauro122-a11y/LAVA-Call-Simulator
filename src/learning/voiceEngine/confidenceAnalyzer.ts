import type { VoiceInput, ConfidenceReport, FillerReport } from './types';
import { clamp } from './extract';

// Feature 6 — confidence & delivery stability.
export function analyzeConfidence(input: VoiceInput, fillers: FillerReport): ConfidenceReport {
  const base = input.categoryScores['Confidence'] ?? input.overallScore;
  const hesitation = clamp(Math.min(100, fillers.perMinute * 9));
  const confidence = clamp(base - hesitation * 0.25);

  const completedSentences = (input.transcript.match(/[.!?]+/g) ?? []).length;
  const sentenceCompletion = clamp(50 + completedSentences * 6);

  return {
    confidence,
    hesitation,
    speechRhythm: clamp(base - fillers.perMinute * 4),
    sentenceCompletion,
    responseCertainty: clamp(confidence - (input.transcript.includes('maybe') || input.transcript.includes('i think') ? 8 : 0)),
    voiceStability: clamp((confidence + (input.categoryScores['Tone'] ?? base)) / 2),
    professionalPresence: clamp((confidence + (input.categoryScores['Professionalism'] ?? base)) / 2),
  };
}
