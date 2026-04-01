import { Role } from "@prisma/client";

export type RoleHierarchy = typeof ROLE_HIERARCHY;

export const ROLE_HIERARCHY = {
  [Role.SUPER_ADMIN]: 5,
  [Role.ADMIN]: 4,
  [Role.MANAGER]: 3,
  [Role.AGENT]: 2,
  [Role.ELECTED_OFFICIAL]: 1,
} as const;

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  // ELECTED_OFFICIAL is special - it doesn't follow hierarchy
  if (requiredRole === Role.ELECTED_OFFICIAL) {
    return userRole === Role.ELECTED_OFFICIAL;
  }

  if (userRole === Role.ELECTED_OFFICIAL) {
    // ELECTED_OFFICIAL cannot access other roles
    return false;
  }

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export class AuthorizationError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function createRoleGuard(requiredRole: Role) {
  return (userRole: Role): boolean => {
    return hasMinimumRole(userRole, requiredRole);
  };
}

export function checkRole(userRole: Role | undefined, requiredRole: Role): void {
  if (!userRole) {
    throw new AuthorizationError("User must be authenticated");
  }

  if (!hasMinimumRole(userRole, requiredRole)) {
    throw new AuthorizationError(
      `User role "${userRole}" does not meet minimum required role "${requiredRole}"`
    );
  }
}

export const roleGuards = {
  isSuperAdmin: createRoleGuard(Role.SUPER_ADMIN),
  isAdmin: createRoleGuard(Role.ADMIN),
  isManager: createRoleGuard(Role.MANAGER),
  isAgent: createRoleGuard(Role.AGENT),
  isElectedOfficial: (userRole: Role) => userRole === Role.ELECTED_OFFICIAL,
};
