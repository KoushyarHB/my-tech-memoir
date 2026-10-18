import type { PaginationQuery } from "@/shared/types/pagination";

/**
 * Shared kernel: serialise a pagination query into a URL search string.
 *
 * Used by every client service so the wire format stays identical across
 * domains (and matches the `page`/`pageSize`/`search`/`filters`/`sortBy`/
 * `sortOrder`/`searchFields` contract the route handlers parse).
 */
export function toPaginationQueryString(
  query: Partial<PaginationQuery> = {}
): string {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.search) params.set("search", query.search);
  if (query.filters) params.set("filters", query.filters);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);
  if (query.searchFields?.length) {
    params.set("searchFields", query.searchFields.join(","));
  }

  const search = params.toString();
  return search ? `?${search}` : "";
}
