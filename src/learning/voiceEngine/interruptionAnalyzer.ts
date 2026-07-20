import type { VoiceInput, InterruptionReport } from './types';
import { clamp } from './extract';
import { effectiveWpm } from './paceAnalyzer';

// Feature 5 — interruption / overlap estimation. Very fast speech and low patience
// correlate with more overlaps; deterministic where live diarization is unavailable.
export function analyzeInterruptions(input: VoiceInput): InterruptionReport {
  const wpm = effectiveWpm(input);
  const fastFactor = Math.max(0, (wpm - 160) / 60); // >0 when fast
  const turns = input.turns.length || 4;

  const candidateInterruptedAI = Math.round(fastFactor * 3);
  const aiInterruptedCandidate = Math.round(fastFactor * 1.5);
  const totalInterruptions = candidateInterruptedAI + aiInterruptedCandidate;
  const talkOverlapSec = Number((totalInterruptions * 0.8).toFixed(1));
  const smoothness = clamp(100 - totalInterruptions * 8 - (turns > 12 ? 5 : 0));

  return { candidateInterruptedAI, aiInterruptedCandidate, talkOverlapSec, totalInterruptions, smoothness };
}
