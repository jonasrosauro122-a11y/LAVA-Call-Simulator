import type { VoiceAnalysis } from './types';
import type { TrendPoint } from '../analysis/types';

export interface VoiceTrends {
  points: TrendPoint[];
  overallVoiceScore: number;
  bestMetric: string;
  focusMetric: string;
}

// Feature 11 — longitudinal voice trends across analyzed sessions.
export function buildVoiceTrends(analyses: VoiceAnalysis[]): VoiceTrends {
  const chrono = [...analyses].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const points: TrendPoint[] = chrono.map((a, i) => ({
    date: a.createdAt,
    label: `#${i + 1}`,
    Confidence: a.confidence.confidence,
    'Speaking Speed': a.speech.wpm,
    Pronunciation: a.pronunciation.overall,
    Listening: a.speech.listeningRatio,
    Professionalism: a.toneEnergy.professional,
    'Fillers/min': a.fillers.perMinute,
    'Dead Air': a.silence.deadAirSec,
    'Voice Score': a.overallVoiceScore,
  }));

  const overall = analyses.length ? Math.round(analyses.reduce((s, a) => s + a.overallVoiceScore, 0) / analyses.length) : 0;

  // Simple strongest / weakest across latest analysis.
  const latest = chrono[chrono.length - 1];
  let bestMetric = '—', focusMetric = '—';
  if (latest) {
    const dims: [string, number][] = [
      ['Confidence', latest.confidence.confidence],
      ['Pronunciation', latest.pronunciation.overall],
      ['Fluency', latest.speech.fluency],
      ['Professionalism', latest.toneEnergy.professional],
      ['Empathy', latest.toneEnergy.empathetic],
    ];
    dims.sort((a, b) => b[1] - a[1]);
    bestMetric = dims[0][0];
    focusMetric = dims[dims.length - 1][0];
  }

  return { points, overallVoiceScore: overall, bestMetric, focusMetric };
}
