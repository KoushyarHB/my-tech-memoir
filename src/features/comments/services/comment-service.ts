import { api } from "@/lib/api-client";
import { toPaginationQueryString } from "@/shared/lib/query-string";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import type {
  BulkModerateCommentsRequest,
  BulkModerationResultDto,
  CommentStatus,
  CreateCommentRequest,
  GetCommentDto,
  GetCommentStatsDto,
  GetModerationCommentDto,
  UpdateCommentRequest,
} from "../types";

/** Comments domain: client-side API functions. */

export async function fetchCommentsPage(
  postId: string,
  query: Partial<PaginationQuery> = {}
): Promise<PaginatedResult<GetCommentDto>> {
  const params = new URLSearchParams(
    toPaginationQueryString(query).replace(/^\?/, "")
  );
  params.set("postId", postId);
  return api.get<PaginatedResult<GetCommentDto>>(
    `/api/comments?${params.toString()}`
  );
}

export async function createComment(
  input: CreateCommentRequest
): Promise<GetCommentDto> {
  return api.post<GetCommentDto>("/api/comments", input);
}

// ── Moderation ──────────────────────────────────────────────────────

export async function fetchModerationPage(
  query: Partial<PaginationQuery> = {}
): Promise<PaginatedResult<GetModerationCommentDto>> {
  return api.get<PaginatedResult<GetModerationCommentDto>>(
    `/api/comments/moderation${toPaginationQueryString(query)}`
  );
}

export async function fetchModerationStats(): Promise<GetCommentStatsDto> {
  return api.get<GetCommentStatsDto>("/api/comments/moderation/stats");
}

export async function fetchModerationThread(
  commentId: string
): Promise<GetModerationCommentDto[]> {
  return api.get<GetModerationCommentDto[]>(
    `/api/comments/${commentId}/thread`
  );
}

export async function updateComment(
  commentId: string,
  input: UpdateCommentRequest
): Promise<GetModerationCommentDto> {
  return api.patch<GetModerationCommentDto>(
    `/api/comments/${commentId}`,
    input
  );
}

export async function setCommentStatus(
  commentId: string,
  status: CommentStatus
): Promise<GetModerationCommentDto> {
  return updateComment(commentId, { status });
}

export async function bulkModerateComments(
  ids: string[],
  status: CommentStatus
): Promise<BulkModerationResultDto> {
  return api.post<BulkModerationResultDto>("/api/comments/bulk", {
    ids,
    status,
  } satisfies BulkModerateCommentsRequest);
}

export async function deleteComment(commentId: string): Promise<void> {
  return api.delete(`/api/comments/${commentId}`);
}

export async function replyToComment(
  commentId: string,
  body: string
): Promise<GetCommentDto> {
  return api.post<GetCommentDto>(`/api/comments/${commentId}/reply`, { body });
}
