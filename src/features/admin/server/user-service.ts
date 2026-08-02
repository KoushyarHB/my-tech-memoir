import { db } from "@/lib/db";
import {
  ASSIGNABLE_ROLES,
  isUserRole,
  type UserRole,
} from "@/features/admin/types/roles";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  createdAt: Date;
};

export { ASSIGNABLE_ROLES, ROLE_LABELS, isUserRole } from "@/features/admin/types/roles";
export type { UserRole } from "@/features/admin/types/roles";

export async function listUsers(): Promise<AdminUser[]> {
  return db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
  actorId: string
): Promise<AdminUser> {
  if (!isUserRole(role)) {
    throw new Error("Invalid role");
  }

  if (userId === actorId && role !== "ADMIN") {
    throw new Error("You cannot demote your own admin account");
  }

  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!existing) {
    throw new Error("User not found");
  }

  if (existing.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("Cannot demote the last admin");
    }
  }

  return db.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
}
