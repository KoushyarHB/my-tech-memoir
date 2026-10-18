/**
 * Central registry of TanStack Query cache keys.
 *
 * Keeping them in one place makes invalidation predictable: mutations
 * invalidate a feature root (e.g. `queryKeys.tags.all`) while queries register
 * with the most specific key they need.
 */
export const queryKeys = {
  comments: {
    all: ["comments"] as const,
    byPost: (postId: string) => ["comments", "post", postId] as const,
  },
  bookmarks: {
    all: ["bookmarks"] as const,
    list: () => ["bookmarks", "list"] as const,
    status: (postId: string) => ["bookmarks", "status", postId] as const,
  },
  tags: {
    all: ["tags"] as const,
  },
  users: {
    all: ["users"] as const,
  },
  posts: {
    all: ["posts"] as const,
    list: (drafts: boolean) => ["posts", "list", { drafts }] as const,
    detail: (postId: string) => ["posts", "detail", postId] as const,
  },
};
