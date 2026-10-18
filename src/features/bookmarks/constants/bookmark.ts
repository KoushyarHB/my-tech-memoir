import type { FilterFieldMap } from "@/shared/lib/prisma-filter";

/** Bookmarks domain: query surface. */

export const BOOKMARK_SORT_FIELDS = ["createdAt"] as const;
export type BookmarkSortField = (typeof BOOKMARK_SORT_FIELDS)[number];
export const DEFAULT_BOOKMARK_SORT_FIELD: BookmarkSortField = "createdAt";

/** Search runs against the bookmarked post, not the bookmark row. */
export const BOOKMARK_SEARCH_FIELDS = ["post.title", "post.excerpt"] as const;

export const BOOKMARK_FILTER_FIELDS = ["postId", "createdAt"] as const;

export const BOOKMARK_FILTER_MAP: FilterFieldMap = {
  postId: { path: "postId", type: "string" },
  createdAt: { path: "createdAt", type: "date" },
};
