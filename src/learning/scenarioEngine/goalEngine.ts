import type { Goal } from './types';
import { createRng } from './rng';

// Feature 5 — goal libraries per role.
const GOALS_BY_ROLE: Record<string, { title: string; category: string }[]> = {
  'insurance-csr': [
    { title: 'Auto Quote', category: 'Quote' }, { title: 'Home Quote', category: 'Quote' },
    { title: 'Umbrella Policy', category: 'Quote' }, { title: 'Boat Insurance', category: 'Quote' },
    { title: 'Trailer Insurance', category: 'Quote' }, { title: 'Policy Change', category: 'Service' },
    { title: 'Billing Question', category: 'Billing' }, { title: 'File a Claim', category: 'Claims' },
    { title: 'Certificate Request', category: 'Service' }, { title: 'Mortgage Change', category: 'Service' },
    { title: 'Address Update', category: 'Service' }, { title: 'Cancellation', category: 'Retention' },
    { title: 'Renewal', category: 'Retention' }, { title: 'Commercial Quote', category: 'Quote' },
  ],
  'medical-va': [
    { title: 'Book Appointment', category: 'Scheduling' }, { title: 'Insurance Verification', category: 'Verification' },
    { title: 'Patient Intake', category: 'Intake' }, { title: 'Prescription Refill', category: 'Clinical' },
    { title: 'Prior Authorization', category: 'Clinical' },
  ],
  'cold-caller': [
    { title: 'Set Appointment', category: 'Booking' }, { title: 'Lead Qualification', category: 'Qualify' },
    { title: 'Discovery Call', category: 'Discovery' }, { title: 'Follow-up', category: 'Nurture' },
    { title: 'Close the Deal', category: 'Close' }, { title: 'Leave a Voicemail', category: 'Outreach' },
  ],
  'sdr': [
    { title: 'Book a Meeting', category: 'Booking' }, { title: 'Qualify (BANT)', category: 'Qualify' },
    { title: 'Discovery Call', category: 'Discovery' }, { title: 'Follow-up', category: 'Nurture' },
  ],
  'appointment-setter': [
    { title: 'Set Appointment', category: 'Booking' }, { title: 'Confirm Appointment', category: 'Booking' },
    { title: 'Qualify Prospect', category: 'Qualify' }, { title: 'Handle Reschedule', category: 'Service' },
  ],
  'receptionist': [
    { title: 'Schedule', category: 'Scheduling' }, { title: 'Transfer Call', category: 'Routing' },
    { title: 'Take a Message', category: 'Routing' }, { title: 'Escalation', category: 'Routing' },
  ],
  'customer-service': [
    { title: 'Resolve Complaint', category: 'Support' }, { title: 'Process Return', category: 'Support' },
    { title: 'Answer Product Question', category: 'Support' }, { title: 'Handle Billing Issue', category: 'Billing' },
  ],
  'executive-assistant': [
    { title: 'Schedule Executive Meeting', category: 'Scheduling' }, { title: 'Screen a Call', category: 'Routing' },
    { title: 'Coordinate Travel', category: 'Coordination' }, { title: 'Relay a Message', category: 'Routing' },
  ],
  'general-english': [
    { title: 'Everyday Conversation', category: 'Practice' }, { title: 'Professional Introduction', category: 'Practice' },
    { title: 'Handle a Request', category: 'Practice' },
  ],
};

const FALLBACK = GOALS_BY_ROLE['customer-service'];

export function goalsForRole(role: string): { title: string; category: string }[] {
  return GOALS_BY_ROLE[role] ?? FALLBACK;
}

// Generate one primary goal and (sometimes) a secondary goal.
export function pickGoals(role: string, seed: number): Goal[] {
  const rng = createRng(seed);
  const pool = rng.shuffle(goalsForRole(role));
  const primarySrc = pool[0];
  const goals: Goal[] = [{ id: `${role}-primary`, title: primarySrc.title, category: primarySrc.category, priority: 'primary' }];
  if (pool[1] && rng.chance(0.5)) {
    goals.push({ id: `${role}-secondary`, title: pool[1].title, category: pool[1].category, priority: 'secondary' });
  }
  return goals;
}
