import type { Personality, AccentProfile } from './types';
import { createRng } from './rng';

const ALL = ['*'];

function voice(accent: AccentProfile, gender: 'neutral' | 'female' | 'male', pace: 'slow' | 'medium' | 'fast') {
  return { accent, gender, pace, provider: null };
}

// Feature 1 — reusable personality profiles. Feature 8 — accent metadata only.
export const PERSONALITIES: Personality[] = [
  { id: 'friendly', name: 'Friendly Customer', archetype: 'Friendly', communicationStyle: 'warm', patience: 85, knowledge: 45, responseStyle: 'chatty and appreciative', formality: 30, trust: 80, vocabulary: 'everyday', questionComplexity: 'low', decisionBehavior: 'deliberate', roles: ALL, accent: 'American', baseEmotion: 'Happy', voice: voice('American', 'female', 'medium') },
  { id: 'professional', name: 'Professional Customer', archetype: 'Professional', communicationStyle: 'formal', patience: 70, knowledge: 70, responseStyle: 'concise and businesslike', formality: 80, trust: 60, vocabulary: 'professional', questionComplexity: 'medium', decisionBehavior: 'analytical', roles: ALL, accent: 'British', baseEmotion: 'Neutral', voice: voice('British', 'male', 'medium') },
  { id: 'busy', name: 'Busy Customer', archetype: 'Busy', communicationStyle: 'terse', patience: 30, knowledge: 55, responseStyle: 'short, wants it fast', formality: 50, trust: 50, vocabulary: 'everyday', questionComplexity: 'low', decisionBehavior: 'impulsive', roles: ALL, accent: 'New York', baseEmotion: 'Impatient', voice: voice('New York', 'male', 'fast') },
  { id: 'angry', name: 'Angry Customer', archetype: 'Angry', communicationStyle: 'direct', patience: 15, knowledge: 50, responseStyle: 'confrontational', formality: 30, trust: 25, vocabulary: 'everyday', questionComplexity: 'medium', decisionBehavior: 'impulsive', roles: ALL, accent: 'American', baseEmotion: 'Frustrated', voice: voice('American', 'male', 'fast') },
  { id: 'confused', name: 'Confused Customer', archetype: 'Confused', communicationStyle: 'chatty', patience: 60, knowledge: 20, responseStyle: 'asks lots of clarifying questions', formality: 40, trust: 55, vocabulary: 'simple', questionComplexity: 'low', decisionBehavior: 'hesitant', roles: ALL, accent: 'Filipino', baseEmotion: 'Confused', voice: voice('Filipino', 'female', 'medium') },
  { id: 'senior', name: 'Senior Citizen', archetype: 'Senior', communicationStyle: 'chatty', patience: 75, knowledge: 30, responseStyle: 'friendly, needs patience', formality: 60, trust: 65, vocabulary: 'simple', questionComplexity: 'low', decisionBehavior: 'deliberate', roles: ALL, accent: 'Southern US', baseEmotion: 'Neutral', voice: voice('Southern US', 'female', 'slow') },
  { id: 'gatekeeper', name: 'Gatekeeper', archetype: 'Gatekeeper', communicationStyle: 'terse', patience: 40, knowledge: 40, responseStyle: 'screens and deflects', formality: 70, trust: 20, vocabulary: 'professional', questionComplexity: 'medium', decisionBehavior: 'deliberate', roles: ['cold-caller', 'sdr', 'appointment-setter'], accent: 'American', baseEmotion: 'Neutral', voice: voice('American', 'female', 'medium') },
  { id: 'decision-maker', name: 'Decision Maker', archetype: 'Decision Maker', communicationStyle: 'direct', patience: 45, knowledge: 80, responseStyle: 'evaluates ROI quickly', formality: 75, trust: 45, vocabulary: 'professional', questionComplexity: 'high', decisionBehavior: 'analytical', roles: ['cold-caller', 'sdr', 'appointment-setter', 'executive-assistant'], accent: 'American', baseEmotion: 'Neutral', voice: voice('American', 'male', 'medium') },
  { id: 'business-owner', name: 'Business Owner', archetype: 'Business Owner', communicationStyle: 'direct', patience: 40, knowledge: 65, responseStyle: 'practical, cost-focused', formality: 55, trust: 45, vocabulary: 'professional', questionComplexity: 'high', decisionBehavior: 'analytical', roles: ['insurance-csr', 'cold-caller', 'sdr'], accent: 'Australian', baseEmotion: 'Neutral', voice: voice('Australian', 'male', 'medium') },
  { id: 'insurance-expert', name: 'Insurance Expert', archetype: 'Expert', communicationStyle: 'formal', patience: 60, knowledge: 95, responseStyle: 'asks technical questions', formality: 80, trust: 55, vocabulary: 'technical', questionComplexity: 'high', decisionBehavior: 'analytical', roles: ['insurance-csr'], accent: 'American', baseEmotion: 'Curious', voice: voice('American', 'male', 'medium') },
  { id: 'first-time-buyer', name: 'First-Time Buyer', archetype: 'Novice', communicationStyle: 'chatty', patience: 65, knowledge: 15, responseStyle: 'nervous, needs guidance', formality: 40, trust: 55, vocabulary: 'simple', questionComplexity: 'low', decisionBehavior: 'hesitant', roles: ['insurance-csr', 'medical-va', 'customer-service'], accent: 'Spanish-influenced English', baseEmotion: 'Anxious', voice: voice('Spanish-influenced English', 'female', 'medium') },
  { id: 'returning-customer', name: 'Returning Customer', archetype: 'Loyal', communicationStyle: 'warm', patience: 70, knowledge: 55, responseStyle: 'familiar and relaxed', formality: 35, trust: 75, vocabulary: 'everyday', questionComplexity: 'medium', decisionBehavior: 'deliberate', roles: ALL, accent: 'American', baseEmotion: 'Satisfied', voice: voice('American', 'female', 'medium') },
  { id: 'medical-patient', name: 'Medical Patient', archetype: 'Patient', communicationStyle: 'chatty', patience: 55, knowledge: 25, responseStyle: 'worried about health', formality: 45, trust: 60, vocabulary: 'simple', questionComplexity: 'low', decisionBehavior: 'hesitant', roles: ['medical-va', 'receptionist'], accent: 'Indian', baseEmotion: 'Anxious', voice: voice('Indian', 'female', 'medium') },
  { id: 'receptionist-persona', name: 'Receptionist', archetype: 'Front Desk', communicationStyle: 'formal', patience: 65, knowledge: 50, responseStyle: 'routes and screens politely', formality: 75, trust: 40, vocabulary: 'professional', questionComplexity: 'medium', decisionBehavior: 'deliberate', roles: ['cold-caller', 'sdr', 'appointment-setter'], accent: 'Filipino', baseEmotion: 'Neutral', voice: voice('Filipino', 'female', 'medium') },
  { id: 'executive', name: 'Executive', archetype: 'Executive', communicationStyle: 'terse', patience: 25, knowledge: 85, responseStyle: 'time-poor, expects value fast', formality: 85, trust: 40, vocabulary: 'professional', questionComplexity: 'high', decisionBehavior: 'analytical', roles: ['executive-assistant', 'sdr', 'cold-caller'], accent: 'British', baseEmotion: 'Impatient', voice: voice('British', 'male', 'fast') },
  { id: 'sales-prospect', name: 'Sales Prospect', archetype: 'Prospect', communicationStyle: 'casual', patience: 50, knowledge: 45, responseStyle: 'open but non-committal', formality: 45, trust: 45, vocabulary: 'everyday', questionComplexity: 'medium', decisionBehavior: 'deliberate', roles: ['cold-caller', 'sdr', 'appointment-setter'], accent: 'American', baseEmotion: 'Curious', voice: voice('American', 'female', 'medium') },
  { id: 'skeptical-prospect', name: 'Skeptical Prospect', archetype: 'Skeptic', communicationStyle: 'direct', patience: 35, knowledge: 60, responseStyle: 'challenges every claim', formality: 55, trust: 20, vocabulary: 'professional', questionComplexity: 'high', decisionBehavior: 'analytical', roles: ['cold-caller', 'sdr', 'appointment-setter'], accent: 'American', baseEmotion: 'Frustrated', voice: voice('American', 'male', 'medium') },
  { id: 'vip', name: 'VIP Customer', archetype: 'VIP', communicationStyle: 'formal', patience: 40, knowledge: 60, responseStyle: 'expects white-glove service', formality: 80, trust: 55, vocabulary: 'professional', questionComplexity: 'medium', decisionBehavior: 'deliberate', roles: ALL, accent: 'New York', baseEmotion: 'Neutral', voice: voice('New York', 'female', 'medium') },
];

export function personalitiesForRole(role: string): Personality[] {
  const matches = PERSONALITIES.filter((p) => p.roles.includes('*') || p.roles.includes(role));
  return matches.length ? matches : PERSONALITIES;
}

export function pickPersonality(role: string, seed: number): Personality {
  return createRng(seed).pick(personalitiesForRole(role));
}

export function getPersonality(id: string): Personality | undefined {
  return PERSONALITIES.find((p) => p.id === id);
}
