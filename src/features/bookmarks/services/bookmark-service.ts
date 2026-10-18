import { api } from "@/lib/api-client";
import { toPaginationQueryString } from "@/shared/lib/query-string";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import type { GetBookmarkDto, ToggleBookmarkDto } from "../types";

/** Bookmarks domain: client-side API functions. */

export async function fetchBookmarksPage(
  query: Partial<PaginationQuery> = {}
): Promise<PaginatedResult<GetBookmarkDto>> {
  return api.get<PaginatedResult<GetBookmarkDto>>(
    `/api/bookmarks${toPaginationQueryString(query)}`
  );
}

export async function fetchBookmarkStatus(postId: string): Promise<boolean> {
  const data = await api.get<{ bookmarked: boolean }>(
    `/api/bookmarks?postId=${encodeURIComponent(postId)}`
  );
  return data?.bookmarked ?? false;
}

export async function toggleBookmark(
  postId: string
): Promise<ToggleBookmarkDto> {
  return api.post<ToggleBookmarkDto>("/api/bookmarks", { postId });
}
