import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import { fetchCommentsPage } from "../services/comment-service";
import type { GetCommentDto } from "../types";

export function useCommentsPage(
  postId: string,
  query: Partial<PaginationQuery>,
  initialData?: PaginatedResult<GetCommentDto>
) {
  return useQuery({
    queryKey: queryKeys.comments.page({ ...query, postId }),
    queryFn: () => fetchCommentsPage(postId, query),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
