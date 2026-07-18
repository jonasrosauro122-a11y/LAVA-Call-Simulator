import type { SimulationAnalysis, TimelineSegment, Metric } from './types';

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function verdict(score: number, metric: string): string {
  if (score >= 80) return `Strong ${metric.toLowerCase()} — this landed well.`;
  if (score >= 60) return `Solid ${metric.toLowerCase()}, with a little room to sharpen.`;
  return `${metric} needs work here — focus your practice on this.`;
}

const PHASES: { at: number; phase: string; note: string; metric: Metric }[] = [
  { at: 0.08, phase: 'Greeting', note: 'Opening and rapport', metric: 'Rapport Building' },
  { at: 0.35, phase: 'Discovery', note: 'Understanding the need', metric: 'Listening Skills' },
  { at: 0.65, phase: 'Objection / Challenge', note: 'Handling pushback', metric: 'Objection Handling' },
  { at: 0.9, phase: 'Closing', note: 'Resolution and next steps', metric: 'Professionalism' },
];

// Synthesizes a phase-by-phase timeline from the analysis (the simulator does not
// emit per-turn timestamps, so phases are distributed across the session duration).
export function buildTimeline(a: SimulationAnalysis): TimelineSegment[] {
  const dur = Math.max(a.durationSeconds, 30);
  return PHASES.map((p) => {
    const score = a.scores[p.metric];
    return {
      time: fmt(dur * p.at),
      phase: p.phase,
      note: p.note,
      feedback: verdict(score, p.metric),
      score,
    };
  });
}
