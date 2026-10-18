import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toPaginationQueryString } from "@/shared/lib/query-string";
import type { PaginatedResult } from "@/shared/types/pagination";

/**
 * Options for an `api-select` column filter.
 *
 * Mirrors tms-frontend's `ApiSelectFilter`: it calls the endpoint with
 * `page`/`pageSize`/`search` and maps `id` → value, `name` → label. Paging is
 * incremental so a long tag list only loads as the user scrolls.
 */

export type ApiSelectOption = {
  value: string;
  label: string;
};

type ApiSelectItem = {
  id: string;
  name: string;
};

export const API_SELECT_PAGE_SIZE = 10;

async function fetchOptionsPage(
  endpoint: string,
  page: number,
  search: string
): Promise<PaginatedResult<ApiSelectOption>> {
  const result = await api.get<PaginatedResult<ApiSelectItem>>(
    `${endpoint}${toPaginationQueryString({
      page,
      pageSize: API_SELECT_PAGE_SIZE,
      search: search || null,
    })}`
  );

  return {
    ...result,
    items: (result.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  };
}

export function useApiSelectOptions(
  endpoint: string | undefined,
  search: string,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: ["api-select", endpoint, search],
    queryFn: ({ pageParam }) =>
      fetchOptionsPage(endpoint as string, pageParam, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: enabled && Boolean(endpoint),
    staleTime: 60_000,
  });
}
