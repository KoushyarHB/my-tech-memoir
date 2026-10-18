/**
 * Shared kernel: pagination contract.
 *
 * The shape mirrors `libs/utility/src/pagination` in tms-backend so a client
 * written against that API can talk to this one without translation:
 *
 *   { page, pageSize, totalItems, totalPages, items }
 */

export type SortOrder = "asc" | "desc";

/** Query parameters accepted by every paginated list endpoint. */
export type PaginationQuery = {
  page: number;
  pageSize: number;
  search?: string | null;
  /** Grid filter expression, e.g. `published = true AND title CONTAINS "react"`. */
  filters?: string | null;
  sortBy?: string | null;
  sortOrder?: SortOrder | null;
  /** Restricts `search` to these fields. */
  searchFields?: string[] | null;
};

export type PaginatedResult<T> = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: T[];
};

/** Convenience: the page of items is all a caller usually needs. */
export type PaginatedItems<T> = PaginatedResult<T>["items"];
