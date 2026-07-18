import type { LearningPath, PathLevel } from '../types/learning';
import type { PositionId } from '../../lib/positionBank';
import { buildRoleModules, FOUNDATIONAL_MODULES } from './curriculum';

interface PathMeta {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  level: PathLevel;
  positionId?: PositionId;
  skills: string[];
}

const ROLE_PATHS: PathMeta[] = [
  {
    id: 'insurance-csr', slug: 'insurance-csr', title: 'Insurance CSR', icon: 'ShieldCheck', level: 'Specialized', positionId: 'insurance-csr',
    tagline: 'Service insurance customers with confidence',
    description: 'Master policy servicing, claims, billing, and de-escalation for insurance customer service roles.',
    skills: ['Insurance terminology', 'Claims handling', 'De-escalation', 'Policy servicing'],
  },
  {
    id: 'cold-calling', slug: 'cold-calling', title: 'Cold Calling', icon: 'PhoneOutgoing', level: 'Specialized', positionId: 'cold-caller',
    tagline: 'Open, pitch, and handle objections on cold calls',
    description: 'Build the confidence and scripts to open cold calls, handle rejection, and earn the next conversation.',
    skills: ['Cold opening', 'Objection handling', 'Confidence', 'Persuasion'],
  },
  {
    id: 'appointment-setter', slug: 'appointment-setter', title: 'Appointment Setter', icon: 'CalendarClock', level: 'Specialized', positionId: 'appointment-setter',
    tagline: 'Book qualified meetings that show up',
    description: 'Learn to qualify prospects, handle scheduling objections, and book appointments that stick.',
    skills: ['Qualifying', 'Scheduling', 'Follow-up', 'Confirmation'],
  },
  {
    id: 'sdr', slug: 'sdr', title: 'Sales Development Rep', icon: 'TrendingUp', level: 'Specialized', positionId: 'sdr',
    tagline: 'Prospect, qualify, and book with a modern SDR playbook',
    description: 'Outbound prospecting, BANT qualification, discovery, and booking qualified meetings for account executives.',
    skills: ['Prospecting', 'BANT qualification', 'Discovery', 'Meeting booking'],
  },
  {
    id: 'receptionist', slug: 'receptionist', title: 'Receptionist', icon: 'Bell', level: 'Core', positionId: 'receptionist',
    tagline: 'Be the professional first voice of a business',
    description: 'Greet, route, and assist callers with warmth, accuracy, and professionalism.',
    skills: ['Call handling', 'Routing', 'Message taking', 'Professional tone'],
  },
  {
    id: 'medical-va', slug: 'medical-va', title: 'Medical VA', icon: 'Stethoscope', level: 'Specialized', positionId: 'medical-va',
    tagline: 'Support medical practices with care and precision',
    description: 'Handle patient scheduling, intake, and communication with empathy and confidentiality.',
    skills: ['Patient communication', 'Scheduling', 'Confidentiality', 'Medical vocabulary'],
  },
  {
    id: 'executive-assistant', slug: 'executive-assistant', title: 'Executive Assistant', icon: 'Briefcase', level: 'Core', positionId: 'executive-assistant',
    tagline: 'Communicate like a trusted right hand',
    description: 'Manage calendars, correspondence, and stakeholders with polished, professional communication.',
    skills: ['Professional writing', 'Prioritization', 'Discretion', 'Stakeholder communication'],
  },
  {
    id: 'customer-support', slug: 'customer-support', title: 'Customer Support', icon: 'Headset', level: 'Core', positionId: 'customer-service',
    tagline: 'Turn frustrated customers into loyal ones',
    description: 'Resolve issues with empathy, clarity, and a reliable problem-solving framework.',
    skills: ['Empathy', 'Problem solving', 'De-escalation', 'Clear explanations'],
  },
];

const FOUNDATIONAL_PATH: LearningPath = {
  id: 'general-english',
  slug: 'general-english',
  title: 'General English Communication',
  tagline: 'Build the communication foundation every role needs',
  description: 'A role-agnostic path covering grammar, pronunciation, fluency, and professional communication — the base skills every other path builds on.',
  icon: 'Languages',
  level: 'Foundational',
  estimatedHours: 2,
  skills: ['Grammar', 'Pronunciation', 'Fluency', 'Professional communication'],
  modules: FOUNDATIONAL_MODULES,
};

function estimateHours(modules: { estimatedMinutes: number }[]): number {
  const mins = modules.reduce((sum, m) => sum + m.estimatedMinutes, 0);
  return Math.max(1, Math.round(mins / 60));
}

const rolePaths: LearningPath[] = ROLE_PATHS.map((meta) => {
  const modules = buildRoleModules(meta.positionId as PositionId);
  return {
    id: meta.id,
    slug: meta.slug,
    title: meta.title,
    tagline: meta.tagline,
    description: meta.description,
    icon: meta.icon,
    level: meta.level,
    positionId: meta.positionId,
    estimatedHours: estimateHours(modules),
    skills: meta.skills,
    modules,
  };
});

// Foundational path first, then role paths.
export const LEARNING_PATHS: LearningPath[] = [FOUNDATIONAL_PATH, ...rolePaths];

export function getPath(pathId: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === pathId || p.slug === pathId);
}

export function getModule(pathId: string, moduleId: string) {
  const path = getPath(pathId);
  return path?.modules.find((m) => m.id === moduleId);
}

// Resolve a module by its (globally unique) id, returning its parent path too.
export function findModule(moduleId: string): { path: LearningPath; moduleIndex: number } | undefined {
  for (const path of LEARNING_PATHS) {
    const moduleIndex = path.modules.findIndex((m) => m.id === moduleId);
    if (moduleIndex >= 0) return { path, moduleIndex };
  }
  return undefined;
}
