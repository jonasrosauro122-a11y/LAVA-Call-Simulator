import type { Goal, ScenarioType, ScenarioDifficulty } from './types';

const SKILLS_BY_ROLE: Record<string, string[]> = {
  'insurance-csr': ['Active listening', 'Policy explanation', 'De-escalation', 'Accuracy'],
  'medical-va': ['Empathy', 'Confidentiality', 'Scheduling', 'Clarity'],
  'cold-caller': ['Opening', 'Objection handling', 'Persuasion', 'Confidence'],
  'sdr': ['Qualification', 'Discovery', 'Value framing', 'Booking'],
  'appointment-setter': ['Qualifying', 'Scheduling', 'Confirmation', 'Follow-up'],
  'receptionist': ['Call routing', 'Professional tone', 'Message taking', 'Screening'],
  'customer-service': ['Empathy', 'Problem solving', 'Clear explanation', 'De-escalation'],
  'executive-assistant': ['Discretion', 'Prioritization', 'Professional writing', 'Coordination'],
  'general-english': ['Grammar', 'Fluency', 'Clarity', 'Professional tone'],
};

const OBJECTIVES_BY_ROLE: Record<string, string[]> = {
  'insurance-csr': ['Correctly identify the customer need', 'Explain options clearly', 'Resolve or route the request'],
  'medical-va': ['Verify patient identity', 'Handle the request with empathy', 'Confirm next steps'],
  'cold-caller': ['Earn the first 30 seconds', 'Handle at least one objection', 'Secure a next step'],
  'sdr': ['Qualify the prospect', 'Uncover a real need', 'Book a meeting'],
  'appointment-setter': ['Qualify the lead', 'Handle scheduling objections', 'Confirm the appointment'],
  'receptionist': ['Greet professionally', 'Route accurately', 'Capture complete information'],
  'customer-service': ['Acknowledge the concern', 'Offer a concrete solution', 'Confirm satisfaction'],
  'executive-assistant': ['Screen appropriately', 'Protect the executive’s time', 'Relay accurately'],
  'general-english': ['Speak clearly', 'Use correct grammar', 'Maintain a professional tone'],
};

const FALLBACK_SKILLS = SKILLS_BY_ROLE['customer-service'];
const FALLBACK_OBJ = OBJECTIVES_BY_ROLE['customer-service'];

function minutesFor(difficulty: ScenarioDifficulty): number {
  return { Beginner: 4, Intermediate: 6, Advanced: 8, Expert: 10, Master: 12 }[difficulty];
}

export function skillsForRole(role: string): string[] {
  return SKILLS_BY_ROLE[role] ?? FALLBACK_SKILLS;
}

export function buildScenarioType(role: string, goal: Goal, difficulty: ScenarioDifficulty): ScenarioType {
  return {
    id: `${role}-${goal.id}`,
    label: goal.title,
    expectedSkills: skillsForRole(role),
    learningObjectives: OBJECTIVES_BY_ROLE[role] ?? FALLBACK_OBJ,
    estimatedMinutes: minutesFor(difficulty),
  };
}
