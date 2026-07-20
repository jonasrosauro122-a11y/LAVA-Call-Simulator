import type { VoiceInput, FillerReport, FillerHit } from './types';
import { fmtTime } from './extract';

const FILLERS = ['um', 'uh', 'like', 'actually', 'basically', 'literally', 'kind of', 'sort of', 'you know', 'i mean'];

export function analyzeFillers(input: VoiceInput): FillerReport {
  const text = ` ${input.transcript.toLowerCase()} `;
  const byWord: { word: string; count: number }[] = [];
  const timeline: FillerHit[] = [];
  let total = 0;

  // Locate each filler occurrence and map its word-index to an approximate time.
  const lowerWords = input.transcript.toLowerCase().split(/\s+/);
  for (const filler of FILLERS) {
    const re = new RegExp(`(?:^|\\W)${filler.replace(/ /g, '\\s+')}(?:$|\\W)`, 'g');
    let count = 0;
    while (re.exec(text) !== null) count++;
    if (count > 0) {
      byWord.push({ word: filler, count });
      total += count;
    }
  }

  // Build a timeline by scanning the word stream.
  lowerWords.forEach((w, i) => {
    const clean = w.replace(/[^a-z]/g, '');
    if (FILLERS.includes(clean)) {
      const atSec = input.words ? Math.round((i / input.words) * input.durationSeconds) : 0;
      timeline.push({ word: clean, atSec, time: fmtTime(atSec) });
    }
  });

  const minutes = Math.max(input.durationSeconds / 60, 0.25);
  return {
    total,
    perMinute: Number((total / minutes).toFixed(1)),
    frequency: input.words ? Number(((total / input.words) * 100).toFixed(1)) : 0,
    byWord: byWord.sort((a, b) => b.count - a.count),
    timeline,
  };
}
