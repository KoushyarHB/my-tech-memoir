import { api } from "@/lib/api-client";
import type { UserRole } from "@/features/admin/types/roles";
import type { AdminUserRow } from "../types/users";

export async function fetchUsers(): Promise<AdminUserRow[]> {
  return api.get<AdminUserRow[]>("/api/users");
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<AdminUserRow> {
  return api.patch<AdminUserRow>(`/api/users/${userId}`, { role });
}
