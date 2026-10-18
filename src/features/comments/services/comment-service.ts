import { api } from "@/lib/api-client";
import { toPaginationQueryString } from "@/shared/lib/query-string";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import type { CreateCommentRequest, GetCommentDto } from "../types";

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
