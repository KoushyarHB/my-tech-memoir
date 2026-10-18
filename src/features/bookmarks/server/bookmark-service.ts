import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import type { GetBookmarkDto, ToggleBookmarkDto } from "../types";
import {
  findBookmark,
  findBookmarksPage,
  toggleBookmarkRecord,
} from "./bookmark-repository";

/** Bookmarks domain: business rules. */

export async function getBookmarksPage(
  userId: string,
  query: PaginationQuery
): Promise<PaginatedResult<GetBookmarkDto>> {
  return findBookmarksPage(userId, query);
}

export async function isBookmarked(
  userId: string,
  postId: string
): Promise<boolean> {
  const bookmark = await findBookmark(userId, postId);
  return bookmark !== null;
}

export async function toggleBookmark(
  userId: string,
  postId: string
): Promise<ToggleBookmarkDto> {
  return toggleBookmarkRecord(userId, postId);
}
