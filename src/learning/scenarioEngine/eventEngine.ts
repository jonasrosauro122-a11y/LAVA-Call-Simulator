import type { RandomEvent } from './types';
import type { Rng } from './rng';

// Feature 7 — realistic events that can be injected naturally mid-conversation.
export const RANDOM_EVENTS: RandomEvent[] = [
  { id: 'other-call', title: 'Incoming call', description: 'The customer receives another call.', effect: 'They ask to be put on hold briefly.' },
  { id: 'manager-joins', title: 'Manager joins', description: 'A manager joins the line.', effect: 'A second, more skeptical voice enters.' },
  { id: 'spouse-interrupts', title: 'Spouse interrupts', description: 'A spouse interrupts in the background.', effect: 'The customer gets briefly distracted.' },
  { id: 'poor-connection', title: 'Poor connection', description: 'The phone connection degrades.', effect: 'The customer asks you to repeat something.' },
  { id: 'wrong-number', title: 'Wrong number', description: 'It turns out to be a partial wrong number.', effect: 'You must re-confirm who you are speaking with.' },
  { id: 'topic-change', title: 'Topic change', description: 'The customer changes the subject.', effect: 'You must steer back to the goal.' },
  { id: 'gets-emotional', title: 'Becomes emotional', description: 'The customer becomes emotional.', effect: 'Empathy is required to continue.' },
  { id: 'policy-expired', title: 'Policy expired', description: 'A policy turns out to be expired.', effect: 'A new complication is introduced.' },
  { id: 'new-objection', title: 'New objection', description: 'A fresh objection appears.', effect: 'You must handle an unexpected concern.' },
];

// Choose potential events for a scenario, scaled by how challenging it should be.
export function pickEvents(rng: Rng, objectionFrequency: number): RandomEvent[] {
  const count = objectionFrequency > 0.6 ? 3 : objectionFrequency > 0.3 ? 2 : 1;
  return rng.shuffle(RANDOM_EVENTS).slice(0, count);
}

// Runtime: decide whether to inject an event on a given turn.
export function maybeInject(rng: Rng, objectionFrequency: number, pool: RandomEvent[]): RandomEvent | null {
  if (!pool.length) return null;
  return rng.chance(objectionFrequency * 0.4) ? rng.pick(pool) : null;
}
