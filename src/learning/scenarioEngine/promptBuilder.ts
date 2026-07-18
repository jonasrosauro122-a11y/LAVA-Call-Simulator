import type { Personality, Emotion, Goal, ScenarioType, ConversationPhase, ScenarioDifficulty, RandomEvent } from './types';

export interface PromptParts {
  role: string;
  personality: Personality;
  emotion: Emotion;
  goals: Goal[];
  scenarioType: ScenarioType;
  difficulty: ScenarioDifficulty;
  phase: ConversationPhase;
  events: RandomEvent[];
  memoryBriefing?: string;
}

// The single place that renders a scenario into text an LLM would consume.
// Swapping to a real model requires no changes here — only the caller changes.
export function buildSystemPrompt(p: PromptParts): string {
  const primary = p.goals.find((g) => g.priority === 'primary') ?? p.goals[0];
  return [
    `You are role-playing a ${p.personality.name.toLowerCase()} interacting with a trainee ${p.role.replace(/-/g, ' ')}.`,
    `Personality: ${p.personality.archetype}. Communication style: ${p.personality.communicationStyle}. Formality ${p.personality.formality}/100, patience ${p.personality.patience}/100, trust ${p.personality.trust}/100.`,
    `Vocabulary: ${p.personality.vocabulary}. Decision behavior: ${p.personality.decisionBehavior}. Accent: ${p.personality.accent}.`,
    `Current emotion: ${p.emotion}. Let your emotion shift naturally based on how well the trainee handles you.`,
    `Your goal in this call: ${primary?.title ?? 'get help'} (${primary?.category ?? 'general'}).`,
    `Difficulty: ${p.difficulty}. Stay in the "${p.phase}" phase unless the trainee moves the conversation forward.`,
    p.events.length ? `You may naturally introduce: ${p.events.map((e) => e.title).join(', ')}.` : '',
    p.memoryBriefing ? `Memory: ${p.memoryBriefing}` : '',
    `Never break character. Keep responses to 1-3 sentences. Never ask for information you already have.`,
  ].filter(Boolean).join('\n');
}

export function buildOpeningLine(p: PromptParts): string {
  const primary = p.goals.find((g) => g.priority === 'primary') ?? p.goals[0];
  const goal = primary?.title.toLowerCase() ?? 'some help';
  const byStyle: Record<Personality['communicationStyle'], string> = {
    terse: `Hi — I need ${goal}. Quickly, please.`,
    direct: `Yeah, hi. I'm calling about ${goal}. Let's get to it.`,
    warm: `Oh hello! Thanks for taking my call — I'm hoping to get ${goal}.`,
    chatty: `Hi there! So, um, I'm not totally sure how this works, but I need ${goal}.`,
    formal: `Good day. I'm contacting you regarding ${goal}.`,
    casual: `Hey, how's it going? I wanted to ask about ${goal}.`,
  };
  return byStyle[p.personality.communicationStyle];
}
