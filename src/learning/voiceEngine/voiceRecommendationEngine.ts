import type { VoiceAnalysis, VoiceRecommendation } from './types';

// Feature 12 — personalized voice coaching, each mapped to a lesson where relevant.
export function recommendVoiceCoaching(a: VoiceAnalysis): VoiceRecommendation[] {
  const recs: VoiceRecommendation[] = [];

  if (a.fillers.perMinute >= 3) recs.push({ title: 'Reduce filler words', detail: `You averaged ${a.fillers.perMinute}/min. Pause silently instead of saying "um".`, lessonModuleId: 'english-m3', lessonTitle: 'Fluency & Conversation' });
  if (a.speech.speakingSpeed === 'Fast' || a.speech.speakingSpeed === 'Very Fast') recs.push({ title: 'Slow down', detail: `You spoke at ${a.speech.wpm} WPM. Aim for 130–160.`, lessonModuleId: 'english-m2', lessonTitle: 'Pronunciation & Clarity' });
  if (a.confidence.confidence < 65) recs.push({ title: 'Increase confidence', detail: 'Finish sentences firmly and reduce hedging.', lessonModuleId: 'english-m3', lessonTitle: 'Fluency & Conversation' });
  if (a.speech.avgSentenceLength > 22) recs.push({ title: 'Use shorter sentences', detail: 'Break long sentences into clear, single ideas.', lessonModuleId: 'english-m1', lessonTitle: 'Grammar Essentials' });
  if (a.silence.deadAirSec > 8) recs.push({ title: 'Pause naturally', detail: 'Trim dead air; keep pauses purposeful.', lessonModuleId: 'english-m2', lessonTitle: 'Pronunciation & Clarity' });
  if (a.toneEnergy.empathetic < 60) recs.push({ title: 'Practice empathy', detail: 'Acknowledge feelings before solving.', lessonModuleId: 'english-m4', lessonTitle: 'Professional Communication' });
  if (a.pronunciation.overall < 70) recs.push({ title: 'Improve pronunciation', detail: 'Drill domain terms and enunciate endings.', lessonModuleId: 'english-m2', lessonTitle: 'Pronunciation & Clarity' });
  if (a.speech.listeningRatio < 35) recs.push({ title: 'Practice active listening', detail: 'Ask more questions and let the customer talk.', lessonModuleId: 'english-m4', lessonTitle: 'Professional Communication' });

  if (!recs.length) recs.push({ title: 'Keep it up', detail: 'Strong, balanced delivery. Maintain this consistency.' });
  return recs;
}
