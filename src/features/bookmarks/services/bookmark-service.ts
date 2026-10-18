import { api } from "@/lib/api-client";
import type { ToggleBookmarkResponse } from "../types";

export async function fetchBookmarkStatus(postId: string): Promise<boolean> {
  const data = await api.get<{ bookmarked: boolean }>(
    `/api/bookmarks?postId=${encodeURIComponent(postId)}`
  );
  return data?.bookmarked ?? false;
}

export async function toggleBookmark(
  postId: string
): Promise<ToggleBookmarkResponse> {
  return api.post<ToggleBookmarkResponse>("/api/bookmarks", { postId });
}
