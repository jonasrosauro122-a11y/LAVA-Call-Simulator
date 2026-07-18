import type { Emotion, EmotionTrigger, Personality } from './types';

export const EMOTIONS: Emotion[] = [
  'Happy', 'Neutral', 'Confused', 'Frustrated', 'Anxious',
  'Excited', 'Impatient', 'Curious', 'Disappointed', 'Satisfied',
];

// Ordered from negative (0) to positive (5) for movement calculations.
const VALENCE: Record<Emotion, number> = {
  Frustrated: 0, Disappointed: 0, Impatient: 1, Anxious: 1, Confused: 2,
  Neutral: 3, Curious: 3, Happy: 4, Excited: 4, Satisfied: 5,
};

const AT_VALENCE: Record<number, Emotion> = {
  0: 'Frustrated', 1: 'Impatient', 2: 'Confused', 3: 'Neutral', 4: 'Happy', 5: 'Satisfied',
};

const TRIGGER_DELTA: Record<EmotionTrigger, number> = {
  good_answer: 1,
  excellent_empathy: 2,
  objection_handled: 2,
  bad_answer: -1,
  incorrect_info: -2,
  interruption: -1,
  long_silence: -1,
};

export function initialEmotion(personality: Personality): Emotion {
  return personality.baseEmotion;
}

// Feature 2 — emotion changes dynamically based on triggers, tempered by patience.
export function transition(current: Emotion, trigger: EmotionTrigger, personality: Personality): Emotion {
  const patienceFactor = personality.patience < 40 && TRIGGER_DELTA[trigger] < 0 ? 1.5 : 1;
  const delta = Math.round(TRIGGER_DELTA[trigger] * patienceFactor);
  const level = Math.max(0, Math.min(5, (VALENCE[current] ?? 3) + delta));
  return AT_VALENCE[level];
}
