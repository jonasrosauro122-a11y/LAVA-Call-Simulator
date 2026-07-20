import type { Role, Permission } from '../types';
import { ROLES, roleRank } from './roleEngine';

// Permission Engine — a modular matrix. Each role lists the permissions it INTRODUCES;
// a role also inherits everything granted to any lower-ranked role. Extending the
// model = add a permission to a role's list (or add a new role in roleEngine).
const GRANTS: Record<Role, Permission[]> = {
  learner: ['view_own_progress'],
  trainer: ['view_learners', 'view_assignments', 'assign_content', 'give_feedback', 'view_analytics', 'view_cohorts', 'send_notifications', 'generate_reports'],
  training_manager: ['manage_learners', 'manage_cohorts'],
  supervisor: [],
  admin: ['manage_roles'],
  company_admin: ['view_company', 'manage_company'],
  enterprise_owner: [],
};

// Effective permissions = union of grants from this role and all lower-ranked roles.
export function permissionsFor(role: Role): Set<Permission> {
  const rank = roleRank(role);
  const perms = new Set<Permission>();
  for (const r of ROLES) {
    if (r.rank <= rank) GRANTS[r.id].forEach((p) => perms.add(p));
  }
  return perms;
}

export function can(role: Role, permission: Permission): boolean {
  return permissionsFor(role).has(permission);
}

export function canAny(role: Role, permissions: Permission[]): boolean {
  const set = permissionsFor(role);
  return permissions.some((p) => set.has(p));
}
