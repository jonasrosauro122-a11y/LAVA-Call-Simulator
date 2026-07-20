import type { VoiceInput, PronunciationReport } from './types';
import { clamp } from './extract';

const INSURANCE_TERMS = ['deductible', 'premium', 'liability', 'umbrella', 'endorsement', 'coverage', 'policy', 'claim', 'underwriting'];
const CARRIERS = ['progressive', 'geico', 'allstate', 'state farm', 'nationwide', 'liberty mutual', 'travelers'];
const BUSINESS_VOCAB = ['invoice', 'appointment', 'schedule', 'follow up', 'quote', 'account', 'verification', 'authorization'];

function countMatches(text: string, list: string[]): { count: number; found: string[] } {
  const found: string[] = [];
  for (const term of list) if (text.includes(term)) found.push(term);
  return { count: found.length, found };
}

// Feature 2 — pronunciation quality (deterministic where live audio is unavailable).
export function analyzePronunciation(input: VoiceInput): PronunciationReport {
  const text = ` ${input.transcript.toLowerCase()} `;
  const base = clamp(input.categoryScores['Pronunciation'] ?? input.overallScore);

  const terms = countMatches(text, INSURANCE_TERMS);
  const carriers = countMatches(text, CARRIERS);
  const biz = countMatches(text, BUSINESS_VOCAB);

  // More correctly-used domain terms nudges the sub-scores above the base.
  const bump = (found: number) => clamp(base + Math.min(12, found * 4));

  // Complexity-derived unknown / mispronounced estimates (stable per transcript).
  const longWords = input.transcript.split(/\s+/).filter((w) => w.replace(/[^a-z]/gi, '').length >= 11).length;
  const unknownWords = Math.round(longWords * 0.4);
  const mispronouncedWords = Math.max(0, Math.round((100 - base) / 12));

  return {
    overall: base,
    terminologyAccuracy: bump(terms.count),
    carrierNames: carriers.count ? bump(carriers.count) : base,
    customerNames: base, // no reliable name signal offline; carried at base
    businessVocabulary: bump(biz.count),
    detectedTerms: [...terms.found, ...carriers.found, ...biz.found],
    unknownWords,
    mispronouncedWords,
  };
}
