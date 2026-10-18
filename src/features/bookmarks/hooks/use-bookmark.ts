import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import {
  fetchBookmarkStatus,
  fetchBookmarksPage,
  toggleBookmark,
} from "../services/bookmark-service";
import type { GetBookmarkDto } from "../types";

export function useBookmarksPage(
  query: Partial<PaginationQuery>,
  initialData?: PaginatedResult<GetBookmarkDto>
) {
  return useQuery({
    queryKey: queryKeys.bookmarks.page(query),
    queryFn: () => fetchBookmarksPage(query),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useBookmarkStatus(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.bookmarks.status(postId),
    queryFn: () => fetchBookmarkStatus(postId),
    enabled,
    staleTime: 30_000,
  });
}

export function useToggleBookmark(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleBookmark(postId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.bookmarks.status(postId),
        data.bookmarked
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    },
  });
}
