"use client";

import { useCallback, useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import type { PaginationQuery } from "@/shared/types/pagination";
import type { DataTableQuery } from "./data-table";

/**
 * Local state for a server-driven table plus the API query it maps onto.
 *
 * Keeps the UI state (TanStack Table shapes) separate from the wire format
 * (`page`/`pageSize`/`search`/`filters`/`sortBy`/`sortOrder`), so components
 * never hand-assemble query strings.
 */
export function useDataTableQuery(options: {
  defaultPageSize?: number;
  defaultSorting?: SortingState;
} = {}) {
  const [query, setQuery] = useState<DataTableQuery>({
    page: 1,
    pageSize: options.defaultPageSize ?? DEFAULT_PAGE_SIZE,
    search: "",
    sorting: options.defaultSorting ?? [],
    columnFilters: [],
  });
  const [filters, setFilters] = useState("");

  const update = useCallback((patch: Partial<DataTableQuery>) => {
    setQuery((previous) => ({ ...previous, ...patch }));
  }, []);

  const apiQuery = useMemo<PaginationQuery>(() => {
    const primarySort = query.sorting[0];
    return {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search.trim() || null,
      filters: filters || null,
      sortBy: primarySort?.id ?? null,
      sortOrder: primarySort ? (primarySort.desc ? "desc" : "asc") : null,
      searchFields: null,
    };
  }, [query, filters]);

  return { query, update, filters, setFilters, apiQuery };
}
