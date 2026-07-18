import type { ModuleScore } from '../../types';
import { METRICS, type CommunicationScores, type Metric, type SimulationAnalysis } from './types';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

interface Extracted {
  cs: Record<string, number>;
  wpm: number | null;
  transcript: string;
  words: number;
  aiResponse: string;
  candidateResponse: string;
  scenario: string;
  duration: number;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function extract(ms: ModuleScore): Extracted {
  const d = asRecord(ms.details);
  const cs = (d.categoryScores as Record<string, number>) ?? {};
  const wpm = typeof d.wpm === 'number' ? (d.wpm as number) : null;

  const responses = Array.isArray(d.responses) ? (d.responses as unknown[]) : [];
  const candidateParts: string[] = [];
  const aiParts: string[] = [];
  let duration = 0;
  let scenario = '';
  for (const r of responses) {
    const rr = asRecord(r);
    if (typeof rr.transcript === 'string') candidateParts.push(rr.transcript as string);
    if (typeof rr.response === 'string') candidateParts.push(rr.response as string);
    if (typeof rr.customerLine === 'string') aiParts.push(rr.customerLine as string);
    if (typeof rr.aiResponse === 'string') aiParts.push(rr.aiResponse as string);
    if (typeof rr.prompt === 'string' && !scenario) scenario = rr.prompt as string;
    if (typeof rr.scenario === 'string' && !scenario) scenario = rr.scenario as string;
    if (typeof rr.durationSeconds === 'number') duration += rr.durationSeconds as number;
  }
  const transcript = typeof d.transcript === 'string' ? (d.transcript as string) : candidateParts.join(' ').trim();
  const words = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
  if (!duration && typeof d.durationSeconds === 'number') duration = d.durationSeconds as number;

  return {
    cs, wpm, transcript, words,
    aiResponse: aiParts.join(' ').trim(),
    candidateResponse: transcript,
    scenario: scenario || ms.module_name,
    duration: duration || Math.max(30, words * 0.4),
  };
}

// Average of the category keys that are actually present.
function avg(cs: Record<string, number>, keys: string[]): number | null {
  const vals = keys.map((k) => cs[k]).filter((v) => typeof v === 'number');
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function pacingFromWpm(wpm: number): number {
  const ideal = 145;
  return clamp(100 - Math.min(100, Math.abs(wpm - ideal) * 0.8));
}

function computeScores(ex: Extracted, overall: number): CommunicationScores {
  const { cs, wpm, words } = ex;
  const or = (v: number | null | undefined, fallback = overall) => (typeof v === 'number' ? v : fallback);

  const map: Record<Metric, number> = {
    'Grammar': or(cs['Grammar']),
    'Vocabulary': or(cs['Vocabulary']),
    'Pronunciation': or(cs['Pronunciation']),
    'Sentence Structure': or(avg(cs, ['Grammar', 'Communication'])),
    'Speaking Confidence': or(cs['Confidence']),
    'Professionalism': or(cs['Professionalism']),
    'Critical Thinking': or(cs['Critical Thinking']),
    'Listening Skills': or(cs['Listening']),
    'Active Listening': or(avg(cs, ['Listening', 'Empathy'])),
    'Empathy': or(cs['Empathy'] ?? avg(cs, ['Customer Service', 'Professionalism'])),
    'Rapport Building': or(avg(cs, ['Empathy', 'Tone', 'Professionalism'])),
    'Persuasiveness': or(cs['Persuasion'] ?? avg(cs, ['Confidence', 'Communication'])),
    'Objection Handling': or(avg(cs, ['Persuasion', 'Critical Thinking', 'Confidence'])),
    'Problem Solving': or(cs['Problem Solving'] ?? cs['Critical Thinking']),
    'Customer Focus': or(avg(cs, ['Customer Service', 'Empathy'])),
    'Sales Skills': or(avg(cs, ['Persuasion', 'Cold Calling Skills', 'Confidence'])),
    'Organization': or(avg(cs, ['Time Management', 'Attention to Detail', 'Communication'])),
    'Tone': or(cs['Tone'] ?? cs['Tone Consistency']),
    'Energy': or(cs['Energy Level'] ?? avg(cs, ['Confidence', 'Fluency'])),
    'Pacing': wpm != null ? pacingFromWpm(wpm) : or(cs['Fluency']),
    'Clarity': or(avg(cs, ['Pronunciation', 'Fluency', 'Communication'])),
    'Response Quality': or(cs['Response Relevance'] ?? cs['Communication']),
    'Completeness': words > 0 ? clamp(Math.min(100, 35 + words * 0.45)) : or(cs['Response Relevance']),
  };

  const out = {} as CommunicationScores;
  for (const m of METRICS) out[m] = clamp(map[m]);
  return out;
}

export interface AnalyzeContext {
  pathId?: string;
  pathTitle?: string;
  moduleId?: string;
}

export function analyzeSimulation(ms: ModuleScore, ctx: AnalyzeContext = {}): SimulationAnalysis {
  const ex = extract(ms);
  const scores = computeScores(ex, ms.score);
  const values = Object.values(scores);
  const communicationScore = clamp(values.reduce((a, b) => a + b, 0) / values.length);

  return {
    id: ms.id,
    simulationId: ms.id,
    pathId: ctx.pathId,
    pathTitle: ctx.pathTitle,
    moduleId: ctx.moduleId,
    moduleName: ms.module_name,
    moduleNumber: ms.module_number,
    scenario: ex.scenario,
    durationSeconds: Math.round(ex.duration),
    transcript: ex.transcript,
    aiResponse: ex.aiResponse,
    candidateResponse: ex.candidateResponse,
    timestamp: ms.created_at,
    overallScore: Math.round(ms.score),
    communicationScore,
    scores,
  };
}

// Weakest / strongest metrics helper.
export function rankMetrics(scores: CommunicationScores): { metric: Metric; score: number }[] {
  return (Object.entries(scores) as [Metric, number][])
    .map(([metric, score]) => ({ metric, score }))
    .sort((a, b) => a.score - b.score);
}
