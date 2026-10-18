import type { UserRole } from "../types/roles";

/** Users domain: role values, labels and guards. */

export const USER_ROLES: UserRole[] = ["USER", "EDITOR", "ADMIN"];

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Reader",
  EDITOR: "Writer",
  ADMIN: "Admin",
};

export const ASSIGNABLE_ROLES: UserRole[] = USER_ROLES;

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" && (USER_ROLES as string[]).includes(value)
  );
}
