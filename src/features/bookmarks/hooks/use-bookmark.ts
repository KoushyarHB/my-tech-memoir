import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchBookmarkStatus, toggleBookmark } from "../services/bookmark-service";

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
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.list() });
    },
  });
}
