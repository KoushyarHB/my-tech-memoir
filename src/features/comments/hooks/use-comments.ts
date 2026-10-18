import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import {
  fetchCommentsPage,
  fetchModerationPage,
  fetchModerationStats,
  fetchModerationThread,
} from "../services/comment-service";
import type {
  GetCommentDto,
  GetCommentStatsDto,
  GetModerationCommentDto,
} from "../types";

/** Public thread for one post. */
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

/** Moderation queue. */
export function useModerationPage(
  query: Partial<PaginationQuery>,
  initialData?: PaginatedResult<GetModerationCommentDto>
) {
  return useQuery({
    queryKey: queryKeys.comments.moderation(query),
    queryFn: () => fetchModerationPage(query),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Counts for the queue tabs and tiles. */
export function useModerationStats(initialData?: GetCommentStatsDto) {
  return useQuery({
    queryKey: queryKeys.comments.stats(),
    queryFn: fetchModerationStats,
    initialData,
    staleTime: 30_000,
  });
}

/** Replies to a comment, loaded only when the detail panel opens. */
export function useModerationThread(commentId: string | null) {
  return useQuery({
    queryKey: queryKeys.comments.thread(commentId ?? ""),
    queryFn: () => fetchModerationThread(commentId as string),
    enabled: Boolean(commentId),
    staleTime: 30_000,
  });
}
