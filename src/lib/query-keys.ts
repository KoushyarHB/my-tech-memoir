import type { PaginationQuery } from "@/shared/types/pagination";

/**
 * Central registry of TanStack Query cache keys.
 *
 * Keys are hierarchical so a mutation can invalidate a feature root
 * (`queryKeys.tags.all`) and every derived page refetches. List keys include
 * the full query object, matching how tms-frontend keys `GenericTable`.
 */
export const queryKeys = {
  comments: {
    all: ["comments"] as const,
    page: (query: Partial<PaginationQuery> & { postId?: string }) =>
      ["comments", "page", query] as const,
  },
  bookmarks: {
    all: ["bookmarks"] as const,
    page: (query: Partial<PaginationQuery>) =>
      ["bookmarks", "page", query] as const,
    status: (postId: string) => ["bookmarks", "status", postId] as const,
  },
  tags: {
    all: ["tags"] as const,
    page: (query: Partial<PaginationQuery>) => ["tags", "page", query] as const,
    stats: () => ["tags", "stats"] as const,
  },
  users: {
    all: ["users"] as const,
    page: (query: Partial<PaginationQuery>) => ["users", "page", query] as const,
    stats: () => ["users", "stats"] as const,
  },
  posts: {
    all: ["posts"] as const,
    page: (query: Partial<PaginationQuery> & { drafts?: boolean }) =>
      ["posts", "page", query] as const,
    detail: (postId: string) => ["posts", "detail", postId] as const,
    stats: () => ["posts", "stats"] as const,
  },
};
