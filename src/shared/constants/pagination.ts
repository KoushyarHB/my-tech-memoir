/**
 * Shared kernel: pagination bounds.
 *
 * `PAGINATION_MAX_PAGE_SIZE` is the same inclusive 1..100 bound tms-backend
 * enforces in `PaginationRequest`, so clients cannot request unbounded pages.
 */

export const PAGINATION_MAX_PAGE_SIZE = 100;
export const PAGINATION_MIN_PAGE_SIZE = 1;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

/** Options offered by the table footer. All must respect the max above. */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50, 100] as const;

/** Same options shaped for the dropdown, which resolves its label from them. */
export const PAGE_SIZE_ITEMS = PAGE_SIZE_OPTIONS.map((value) => ({
  value,
  label: String(value),
}));

/** Longest accepted free-text search term. */
export const SEARCH_MAX_LENGTH = 200;
/** Longest accepted filter expression. */
export const FILTERS_MAX_LENGTH = 2000;
