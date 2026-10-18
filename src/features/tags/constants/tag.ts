import type { FilterFieldMap } from "@/shared/lib/prisma-filter";

/**
 * Tags domain: query surface exposed to clients.
 *
 * These lists are the single source of truth for what a caller may search,
 * sort or filter by. The route handler validates against them before any query
 * runs, and the table column definitions reuse the same field names.
 */

export const TAG_SORT_FIELDS = ["name", "postCount", "createdAt"] as const;
export type TagSortField = (typeof TAG_SORT_FIELDS)[number];
export const DEFAULT_TAG_SORT_FIELD: TagSortField = "name";

export const TAG_SEARCH_FIELDS = ["name", "slug"] as const;

export const TAG_FILTER_FIELDS = ["name", "slug"] as const;

export const TAG_FILTER_MAP: FilterFieldMap = {
  name: { path: "name", type: "string" },
  slug: { path: "slug", type: "string" },
};

export const TAG_NAME_MAX_LENGTH = 60;
export const TAG_SLUG_MAX_LENGTH = 80;

/** Admin tag list page size (the grid is card-based, not a dense table). */
export const TAG_PAGE_SIZE = 30;
