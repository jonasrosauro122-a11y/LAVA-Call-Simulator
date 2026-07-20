import type { ModuleScore } from '../../types';
import type { VoiceInput } from './types';

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

export function extractVoiceInput(ms: ModuleScore): VoiceInput {
  const d = asRecord(ms.details);
  const cs = (d.categoryScores as Record<string, number>) ?? {};
  const wpm = typeof d.wpm === 'number' ? (d.wpm as number) : null;

  const responses = Array.isArray(d.responses) ? (d.responses as unknown[]) : [];
  const turns: VoiceInput['turns'] = [];
  const learnerParts: string[] = [];
  let duration = 0;
  for (const r of responses) {
    const rr = asRecord(r);
    if (typeof rr.transcript === 'string') { learnerParts.push(rr.transcript as string); turns.push({ role: 'learner', text: rr.transcript as string }); }
    else if (typeof rr.response === 'string') { learnerParts.push(rr.response as string); turns.push({ role: 'learner', text: rr.response as string }); }
    if (typeof rr.customerLine === 'string') turns.push({ role: 'ai', text: rr.customerLine as string });
    if (typeof rr.aiResponse === 'string') turns.push({ role: 'ai', text: rr.aiResponse as string });
    if (typeof rr.durationSeconds === 'number') duration += rr.durationSeconds as number;
  }
  const transcript = typeof d.transcript === 'string' ? (d.transcript as string) : learnerParts.join(' ').trim();
  const words = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
  if (!duration && typeof d.durationSeconds === 'number') duration = d.durationSeconds as number;
  if (!duration) duration = Math.max(45, words * 0.42);

  const emotionSummary = asRecord(d.emotionSummary);
  const emotionTimeline = Array.isArray(emotionSummary.timeline) ? (emotionSummary.timeline as unknown[]) : [];

  return {
    simulationId: ms.id,
    transcript,
    words,
    wpm,
    durationSeconds: Math.round(duration),
    categoryScores: cs,
    overallScore: Math.round(ms.score),
    turns,
    emotionTimeline,
  };
}

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
