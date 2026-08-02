export type UserRole = "USER" | "EDITOR" | "ADMIN";

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Reader",
  EDITOR: "Writer",
  ADMIN: "Admin",
};

export const ASSIGNABLE_ROLES: UserRole[] = ["USER", "EDITOR", "ADMIN"];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (ASSIGNABLE_ROLES as string[]).includes(value)
  );
}
