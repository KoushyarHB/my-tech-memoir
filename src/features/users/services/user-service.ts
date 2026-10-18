import { api } from "@/lib/api-client";
import { toPaginationQueryString } from "@/shared/lib/query-string";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import type { GetUserDto, GetUserStatsDto, UserRole } from "../types";

/** Users domain: client-side API functions. */

export async function fetchUsersPage(
  query: Partial<PaginationQuery> = {}
): Promise<PaginatedResult<GetUserDto>> {
  return api.get<PaginatedResult<GetUserDto>>(
    `/api/users${toPaginationQueryString(query)}`
  );
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<GetUserDto> {
  return api.patch<GetUserDto>(`/api/users/${userId}`, { role });
}

export async function fetchUserStats(): Promise<GetUserStatsDto> {
  return api.get<GetUserStatsDto>("/api/users/stats");
}
