import { isUserRole } from "../constants/roles";
import type { GetUserDto, UserRole } from "../types";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import {
  countAdmins,
  findUserById,
  findUsersPage,
  updateUserRoleRecord,
} from "./user-repository";

/**
 * Users domain: business rules.
 *
 * The admin invariants (no self-demotion, never remove the last admin) live
 * here rather than in the route handler, matching how tms-backend keeps them in
 * command handlers.
 */

export class UserValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserValidationError";
    this.status = status;
  }
}

export async function getUsersPage(
  query: PaginationQuery
): Promise<PaginatedResult<GetUserDto>> {
  return findUsersPage(query);
}

export async function getUserById(id: string): Promise<GetUserDto | null> {
  return findUserById(id);
}

export { getUserStats } from "./user-repository";

export async function updateUserRole(
  userId: string,
  role: UserRole,
  actorId: string
): Promise<GetUserDto> {
  if (!isUserRole(role)) {
    throw new UserValidationError("Invalid role");
  }

  if (userId === actorId && role !== "ADMIN") {
    throw new UserValidationError(
      "You cannot demote your own admin account"
    );
  }

  const existing = await findUserById(userId);
  if (!existing) {
    throw new UserValidationError("User not found", 404);
  }

  if (existing.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      throw new UserValidationError("Cannot demote the last admin");
    }
  }

  return updateUserRoleRecord(userId, role);
}
