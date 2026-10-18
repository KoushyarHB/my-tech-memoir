import type { FilterFieldMap } from "@/shared/lib/prisma-filter";

/** Comments domain: query surface + validation limits. */

export const COMMENT_SORT_FIELDS = ["createdAt"] as const;
export type CommentSortField = (typeof COMMENT_SORT_FIELDS)[number];
export const DEFAULT_COMMENT_SORT_FIELD: CommentSortField = "createdAt";

export const COMMENT_SEARCH_FIELDS = ["body", "authorName"] as const;

export const COMMENT_FILTER_FIELDS = [
  "status",
  "postId",
  "userId",
  "authorName",
  "createdAt",
] as const;

export const COMMENT_FILTER_MAP: FilterFieldMap = {
  status: { path: "status", type: "enum" },
  postId: { path: "postId", type: "string" },
  userId: { path: "userId", type: "string" },
  authorName: { path: "authorName", type: "string" },
  createdAt: { path: "createdAt", type: "date" },
};

/** Statuses visible on the public site. */
export const VISIBLE_COMMENT_STATUSES = ["PENDING", "APPROVED"] as const;

export const COMMENT_BODY_MAX_LENGTH = 2000;
export const COMMENT_AUTHOR_NAME_MAX_LENGTH = 100;
export const COMMENT_AUTHOR_EMAIL_MAX_LENGTH = 254;

/** Comments loaded per page on the public post page. */
export const COMMENT_PAGE_SIZE = 10;
