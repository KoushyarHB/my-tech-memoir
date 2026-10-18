import type { FilterFieldMap } from "@/shared/lib/prisma-filter";
import type { UserRole } from "../types/roles";

/** Users domain: query surface. */

export const USER_SORT_FIELDS = [
  "createdAt",
  "name",
  "email",
  "role",
  "postCount",
  "bookmarkCount",
  "commentCount",
] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];
export const DEFAULT_USER_SORT_FIELD: UserSortField = "createdAt";

export const USER_SEARCH_FIELDS = ["name", "email", "bio"] as const;

export const USER_FILTER_FIELDS = [
  "role",
  "email",
  "name",
  "emailVerified",
  "provider",
  "createdAt",
] as const;

export const USER_FILTER_MAP: FilterFieldMap = {
  role: { path: "role", type: "enum" },
  email: { path: "email", type: "string" },
  name: { path: "name", type: "string" },
  emailVerified: { path: "emailVerified", type: "date" },
  createdAt: { path: "createdAt", type: "date" },
  // `accounts` is to-many, so the filter is expressed as `some`.
  provider: { path: "provider", type: "string", relation: "accounts" },
};

/** Sort fields that order by a relation count rather than a column. */
export const USER_COUNT_SORT_FIELDS: Record<
  Extract<UserSortField, "postCount" | "bookmarkCount" | "commentCount">,
  "authoredPosts" | "bookmarks" | "comments"
> = {
  postCount: "authoredPosts",
  bookmarkCount: "bookmarks",
  commentCount: "comments",
};
