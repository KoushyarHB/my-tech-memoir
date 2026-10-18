import type { FilterFieldMap } from "@/shared/lib/prisma-filter";

/**
 * Blog domain: post query surface.
 *
 * tms-backend exposes the same knobs per grid (`search`, `searchFields`,
 * `sortBy`, `sortOrder`, `filters`); these allowlists are what the route
 * handler validates against before touching Prisma.
 */

export const POST_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "publishedAt",
  "title",
  "viewCount",
  "commentCount",
] as const;
export type PostSortField = (typeof POST_SORT_FIELDS)[number];
export const DEFAULT_POST_SORT_FIELD: PostSortField = "createdAt";

export const POST_SEARCH_FIELDS = ["title", "slug", "excerpt"] as const;

export const POST_FILTER_FIELDS = [
  "title",
  "slug",
  "published",
  "viewCount",
  "createdAt",
  "updatedAt",
  "tag",
  "tagId",
] as const;

export const POST_FILTER_MAP: FilterFieldMap = {
  title: { path: "title", type: "string" },
  slug: { path: "slug", type: "string" },
  published: { path: "published", type: "boolean" },
  viewCount: { path: "viewCount", type: "number" },
  createdAt: { path: "createdAt", type: "date" },
  updatedAt: { path: "updatedAt", type: "date" },
  tag: { path: "tag.slug", type: "string", relation: "tags" },
  tagId: { path: "tagId", type: "string", relation: "tags", caseSensitive: true },
};

export const POST_TITLE_MAX_LENGTH = 200;
export const POST_EXCERPT_MAX_LENGTH = 500;
export const POST_CONTENT_MAX_LENGTH = 200_000;
