import type { GetPostSummaryDto } from "@/features/blog/types";

/** Bookmarks domain: response DTO. */
export type GetBookmarkDto = {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
  post: GetPostSummaryDto;
};

/** Result of toggling a bookmark. */
export type ToggleBookmarkDto = {
  bookmarked: boolean;
  bookmarkId: string | null;
};
