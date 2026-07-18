import type { ConversationPhase, ConversationStateData } from './types';

// Feature 4 — the full phase sequence the AI tracks.
export const PHASES: ConversationPhase[] = [
  'Greeting', 'Rapport', 'Discovery', 'Qualification', 'Problem Identification',
  'Education', 'Recommendation', 'Objection Handling', 'Closing', 'Wrap-up',
];

export function createState(): ConversationStateData {
  return { phase: PHASES[0], phaseIndex: 0, turn: 0 };
}

export function advance(state: ConversationStateData): ConversationStateData {
  const phaseIndex = Math.min(PHASES.length - 1, state.phaseIndex + 1);
  return { phase: PHASES[phaseIndex], phaseIndex, turn: state.turn + 1 };
}

export function setPhase(state: ConversationStateData, phase: ConversationPhase): ConversationStateData {
  const phaseIndex = Math.max(0, PHASES.indexOf(phase));
  return { ...state, phase, phaseIndex };
}

export function isPhase(state: ConversationStateData, phase: ConversationPhase): boolean {
  return state.phase === phase;
}
