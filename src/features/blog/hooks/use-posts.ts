import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import { fetchPostStats, fetchPostsPage } from "../services/post-service";
import type { GetPostStatsDto, GetPostSummaryDto } from "../types";

/** Blog domain: paginated post list, optionally including drafts. */
export function usePostsPage(
  query: Partial<PaginationQuery>,
  options: {
    drafts?: boolean;
    initialData?: PaginatedResult<GetPostSummaryDto>;
  } = {}
) {
  return useQuery({
    queryKey: queryKeys.posts.page({ ...query, drafts: options.drafts }),
    queryFn: () => fetchPostsPage(query, { drafts: options.drafts }),
    initialData: options.initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Blog domain: aggregate counts, kept fresh by post mutations. */
export function usePostStats(initialData?: GetPostStatsDto) {
  return useQuery({
    queryKey: queryKeys.posts.stats(),
    queryFn: fetchPostStats,
    initialData,
    staleTime: 60_000,
  });
}
