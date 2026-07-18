import type { SimulationAnalysis, AICoachReport, Metric } from './types';
import { rankMetrics } from './metricsEngine';
import { getPath, findModule } from '../content/paths';

const GRAMMAR_TIPS = [
  'Watch subject–verb agreement: "she has" not "she have".',
  'Use the present perfect for experience: "I have handled" not "I handled since".',
  'Keep sentences to one clear idea; split long run-ons.',
];
const VOCAB_TIPS = [
  'Swap filler words ("stuff", "things") for precise nouns.',
  'Use role-specific vocabulary to sound like an expert.',
  'Replace "good/nice" with stronger words: "reliable", "efficient".',
];
const CONFIDENCE_TIPS = [
  'Replace "um/uh" with a short silent pause.',
  'End statements with a downward tone to sound assured.',
  'Slow down slightly — steady pacing reads as confidence.',
];

const SKILL_LESSON_HINT: Partial<Record<Metric, string>> = {
  'Grammar': 'english-m1', 'Vocabulary': 'english-m1', 'Pronunciation': 'english-m2',
  'Clarity': 'english-m2', 'Pacing': 'english-m2', 'Speaking Confidence': 'english-m3',
  'Empathy': 'english-m4', 'Professionalism': 'english-m4', 'Rapport Building': 'english-m4',
};

const SKILL_SIM: Partial<Record<Metric, { moduleNumber: number; name: string }>> = {
  'Objection Handling': { moduleNumber: 5, name: 'Customer Roleplay' },
  'Persuasiveness': { moduleNumber: 5, name: 'Customer Roleplay' },
  'Sales Skills': { moduleNumber: 5, name: 'Customer Roleplay' },
  'Empathy': { moduleNumber: 5, name: 'Customer Roleplay' },
  'Customer Focus': { moduleNumber: 5, name: 'Customer Roleplay' },
  'Pronunciation': { moduleNumber: 2, name: 'Pronunciation Assessment' },
  'Clarity': { moduleNumber: 2, name: 'Pronunciation Assessment' },
  'Critical Thinking': { moduleNumber: 4, name: 'Conversation Simulation' },
  'Listening Skills': { moduleNumber: 1, name: 'Listening Comprehension' },
};

export function generateAICoach(a: SimulationAnalysis): AICoachReport {
  const ranked = rankMetrics(a.scores);
  const weakest = ranked.slice(0, 4);
  const strongest = [...ranked].reverse().slice(0, 3);

  const strengths = strongest.map((s) => `${s.metric} (${s.score}) — a clear strength.`);
  const improvements = weakest.map((s) => `${s.metric} (${s.score}) — your biggest opportunity to grow.`);

  // Next lesson from the weakest skill that maps to a foundational lesson.
  let nextLesson: AICoachReport['nextLesson'] = null;
  for (const w of weakest) {
    const moduleId = SKILL_LESSON_HINT[w.metric];
    if (moduleId) {
      const fm = findModule(moduleId);
      const path = getPath('general-english');
      if (fm && path) { nextLesson = { pathId: path.id, moduleId, title: fm.path.modules[fm.moduleIndex].title }; break; }
    }
  }

  // Recommended simulation from the weakest skill that maps to a scenario.
  let recommendedSimulation: AICoachReport['recommendedSimulation'] = null;
  for (const w of weakest) {
    const sim = SKILL_SIM[w.metric];
    if (sim) { recommendedSimulation = { ...sim, reason: `Targets your weakest area: ${w.metric}.` }; break; }
  }

  return {
    strengths,
    improvements,
    grammarSuggestions: a.scores['Grammar'] < 75 ? GRAMMAR_TIPS : ['Your grammar is solid — keep it up.'],
    vocabularySuggestions: a.scores['Vocabulary'] < 75 ? VOCAB_TIPS : ['Strong vocabulary — try adding a few advanced terms.'],
    confidenceTips: a.scores['Speaking Confidence'] < 75 ? CONFIDENCE_TIPS : ['You sound confident — maintain that energy.'],
    recommendedPractice: weakest.slice(0, 2).map((w) => `Practice a short drill focused on ${w.metric.toLowerCase()}.`),
    nextLesson,
    recommendedSimulation,
    learningResources: [
      { title: 'Clear Communication Fundamentals', type: 'Lesson' },
      { title: 'Handling Difficult Conversations', type: 'Guide' },
      { title: 'Professional Phone Etiquette', type: 'Article' },
    ],
  };
}
