import type { UserRole } from "../roles";

/** Users domain: role change payload. */
export type UpdateUserRoleRequest = {
  role: UserRole;
};
