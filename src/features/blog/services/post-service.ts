import { api } from "@/lib/api-client";
import { toPaginationQueryString } from "@/shared/lib/query-string";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import type {
  CreatePostRequest,
  GetPostDto,
  GetPostStatsDto,
  GetPostSummaryDto,
  UpdatePostRequest,
} from "../types";

/**
 * Blog domain: client-side API functions.
 *
 * `drafts` maps to the `?drafts=true` flag the list route uses to include
 * unpublished posts (editor-only; the route enforces the permission).
 */

export async function fetchPostsPage(
  query: Partial<PaginationQuery> = {},
  options: { drafts?: boolean } = {}
): Promise<PaginatedResult<GetPostSummaryDto>> {
  const suffix = options.drafts ? "&drafts=true" : "";
  return api.get<PaginatedResult<GetPostSummaryDto>>(
    `/api/posts${toPaginationQueryString(query)}${suffix}`
  );
}

export async function fetchPostById(postId: string): Promise<GetPostDto> {
  return api.get<GetPostDto>(`/api/posts/${postId}`);
}

export async function fetchPostStats(): Promise<GetPostStatsDto> {
  return api.get<GetPostStatsDto>("/api/posts/stats");
}

export async function createPost(
  input: CreatePostRequest
): Promise<GetPostDto> {
  return api.post<GetPostDto>("/api/posts", input);
}

export async function updatePost(
  postId: string,
  input: UpdatePostRequest
): Promise<GetPostDto> {
  return api.put<GetPostDto>(`/api/posts/${postId}`, input);
}

export async function deletePost(postId: string): Promise<void> {
  return api.delete(`/api/posts/${postId}`);
}
