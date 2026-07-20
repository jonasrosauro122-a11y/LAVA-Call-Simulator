import type { VoiceInput, SpeechMetrics } from './types';
import { clamp } from './extract';

const ACK_PHRASES = ['i understand', 'i see', 'got it', 'makes sense', 'that makes sense', 'i hear you', 'absolutely', 'of course'];

// Active listening = healthy listening ratio + acknowledgments + asking questions.
export function analyzeActiveListening(input: VoiceInput, speech: SpeechMetrics): number {
  const text = input.transcript.toLowerCase();
  const acks = ACK_PHRASES.reduce((n, p) => n + (text.includes(p) ? 1 : 0), 0);
  const questions = (input.transcript.match(/\?/g) ?? []).length;
  const ratioScore = 100 - Math.abs(speech.listeningRatio - 50) * 1.4; // best near a 50/50 balance
  return clamp(ratioScore + acks * 6 + questions * 3);
}
