import type { Role, RoleDefinition } from '../types';

// Role Engine — single source of truth for roles and their hierarchy.
// Higher rank inherits every permission of lower ranks (see permissionEngine).
export const ROLES: RoleDefinition[] = [
  { id: 'learner', label: 'Learner', rank: 0, description: 'Takes assessments and learning paths.' },
  { id: 'trainer', label: 'Trainer', rank: 10, description: 'Coaches learners and reviews performance.' },
  { id: 'training_manager', label: 'Training Manager', rank: 20, description: 'Manages trainers, cohorts, and assignments.' },
  { id: 'supervisor', label: 'Supervisor', rank: 30, description: 'Oversees team performance and reporting.' },
  { id: 'admin', label: 'Admin', rank: 40, description: 'Administers the platform and users.' },
  { id: 'company_admin', label: 'Company Administrator', rank: 50, description: 'Administers a company/tenant.' },
  { id: 'enterprise_owner', label: 'Enterprise Owner', rank: 60, description: 'Owns the enterprise account (future multi-tenant).' },
];

const BY_ID = new Map(ROLES.map((r) => [r.id, r]));

export function getRole(id: Role): RoleDefinition {
  return BY_ID.get(id) ?? ROLES[0];
}

export function roleRank(id: Role): number {
  return getRole(id).rank;
}

export function isAtLeast(role: Role, min: Role): boolean {
  return roleRank(role) >= roleRank(min);
}

export function managementRoles(): RoleDefinition[] {
  return ROLES.filter((r) => r.rank >= 10);
}
