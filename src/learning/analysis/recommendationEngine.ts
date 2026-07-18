import type { CommunicationScores, Metric, Recommendation } from './types';
import { rankMetrics } from './metricsEngine';

interface Rec { title: string; reason: string; to: string; kind: Recommendation['kind']; }

// Each weak skill maps to the most relevant piece of content.
const SKILL_TARGET: Partial<Record<Metric, Rec>> = {
  'Grammar': { kind: 'lesson', title: 'Grammar Essentials', to: '/learning/module/english-m1', reason: 'Sharpen sentence accuracy.' },
  'Vocabulary': { kind: 'lesson', title: 'Grammar Essentials', to: '/learning/module/english-m1', reason: 'Build a stronger word bank.' },
  'Sentence Structure': { kind: 'lesson', title: 'Grammar Essentials', to: '/learning/module/english-m1', reason: 'Structure clearer sentences.' },
  'Pronunciation': { kind: 'module', title: 'Pronunciation & Clarity', to: '/learning/module/english-m2', reason: 'Be understood the first time.' },
  'Clarity': { kind: 'module', title: 'Pronunciation & Clarity', to: '/learning/module/english-m2', reason: 'Improve delivery clarity.' },
  'Pacing': { kind: 'module', title: 'Pronunciation & Clarity', to: '/learning/module/english-m2', reason: 'Control your speaking pace.' },
  'Speaking Confidence': { kind: 'module', title: 'Fluency & Conversation', to: '/learning/module/english-m3', reason: 'Speak with more assurance.' },
  'Energy': { kind: 'module', title: 'Fluency & Conversation', to: '/learning/module/english-m3', reason: 'Bring more energy to calls.' },
  'Professionalism': { kind: 'module', title: 'Professional Communication', to: '/learning/module/english-m4', reason: 'Polish your professional tone.' },
  'Organization': { kind: 'module', title: 'Professional Communication', to: '/learning/module/english-m4', reason: 'Structure your responses.' },
  'Tone': { kind: 'module', title: 'Professional Communication', to: '/learning/module/english-m4', reason: 'Keep a warm, consistent tone.' },
  'Empathy': { kind: 'path', title: 'Customer Support path', to: '/learning/path/customer-support', reason: 'Practice empathetic service.' },
  'Rapport Building': { kind: 'path', title: 'Customer Support path', to: '/learning/path/customer-support', reason: 'Build rapport faster.' },
  'Customer Focus': { kind: 'path', title: 'Customer Support path', to: '/learning/path/customer-support', reason: 'Center the customer.' },
  'Persuasiveness': { kind: 'path', title: 'Cold Calling path', to: '/learning/path/cold-calling', reason: 'Make a stronger case.' },
  'Objection Handling': { kind: 'simulation', title: 'Customer Roleplay simulation', to: '/learning/module/cold-calling-m3', reason: 'Drill objection handling.' },
  'Sales Skills': { kind: 'path', title: 'SDR path', to: '/learning/path/sdr', reason: 'Develop core sales skills.' },
  'Critical Thinking': { kind: 'simulation', title: 'Conversation Simulation', to: '/learning/module/general-english-m3', reason: 'Think on your feet.' },
  'Problem Solving': { kind: 'path', title: 'Customer Support path', to: '/learning/path/customer-support', reason: 'Practice resolving issues.' },
  'Listening Skills': { kind: 'module', title: 'Fluency & Conversation', to: '/learning/module/english-m3', reason: 'Listen more actively.' },
  'Active Listening': { kind: 'module', title: 'Fluency & Conversation', to: '/learning/module/english-m3', reason: 'Reflect back what you hear.' },
  'Response Quality': { kind: 'module', title: 'Professional Communication', to: '/learning/module/english-m4', reason: 'Give more complete answers.' },
  'Completeness': { kind: 'module', title: 'Professional Communication', to: '/learning/module/english-m4', reason: 'Cover the full question.' },
};

export function recommend(scores: CommunicationScores, limit = 5): Recommendation[] {
  const weakest = rankMetrics(scores).filter((m) => m.score < 80);
  const out: Recommendation[] = [];
  const seen = new Set<string>();
  for (const w of weakest) {
    const target = SKILL_TARGET[w.metric];
    if (!target || seen.has(target.to)) continue;
    seen.add(target.to);
    out.push({ ...target, weakSkill: w.metric });
    if (out.length >= limit) break;
  }
  return out;
}

// Feature 9: scenario recommendations (simulations) driven by weak skills.
export function recommendScenarios(scores: CommunicationScores, limit = 3): Recommendation[] {
  return recommend(scores, 10).filter((r) => r.kind === 'simulation' || r.kind === 'path').slice(0, limit);
}
