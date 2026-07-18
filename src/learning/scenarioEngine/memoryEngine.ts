import type { ConversationMemoryData, ConversationPhase } from './types';

// Feature 3 — the AI remembers facts, promises, asked questions, and history,
// so it never re-asks for information already provided.
export function createMemory(): ConversationMemoryData {
  return { facts: {}, askedQuestions: [], promises: [], history: [] };
}

export function remember(mem: ConversationMemoryData, key: string, value: string): ConversationMemoryData {
  return { ...mem, facts: { ...mem.facts, [key]: value } };
}

export function recall(mem: ConversationMemoryData, key: string): string | undefined {
  return mem.facts[key];
}

export function knows(mem: ConversationMemoryData, key: string): boolean {
  return key in mem.facts;
}

export function markAsked(mem: ConversationMemoryData, question: string): ConversationMemoryData {
  if (mem.askedQuestions.includes(question)) return mem;
  return { ...mem, askedQuestions: [...mem.askedQuestions, question] };
}

export function hasAsked(mem: ConversationMemoryData, question: string): boolean {
  return mem.askedQuestions.includes(question);
}

export function addPromise(mem: ConversationMemoryData, promise: string): ConversationMemoryData {
  return { ...mem, promises: [...mem.promises, promise] };
}

export function addTurn(mem: ConversationMemoryData, role: 'ai' | 'learner', text: string, phase: ConversationPhase): ConversationMemoryData {
  return { ...mem, history: [...mem.history, { role, text, phase }] };
}

// Renders the memory into a compact briefing the LLM can consume.
export function memoryBriefing(mem: ConversationMemoryData): string {
  const facts = Object.entries(mem.facts).map(([k, v]) => `${k}: ${v}`).join('; ') || 'none yet';
  return [
    `Known facts: ${facts}.`,
    mem.promises.length ? `Promises made: ${mem.promises.join('; ')}.` : '',
    mem.askedQuestions.length ? `Already asked: ${mem.askedQuestions.join('; ')}. Do NOT ask these again.` : '',
  ].filter(Boolean).join(' ');
}
