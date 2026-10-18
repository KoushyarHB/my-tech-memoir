import { auth } from "@/auth";
import { apiError, apiPaginated, apiQueryError, apiSuccess } from "@/lib/api-response";
import { parsePaginationQuery } from "@/shared/lib/pagination";
import {
  getBookmarksPage,
  isBookmarked,
  toggleBookmark,
} from "@/features/bookmarks/server/bookmark-service";

/**
 * GET /api/bookmarks
 *   ?postId=…          → { bookmarked } for that post
 *   ?page&pageSize…    → paginated list for the current user
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Authentication required", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (postId) {
    const bookmarked = await isBookmarked(session.user.id, postId);
    return apiSuccess({ bookmarked });
  }

  try {
    const query = parsePaginationQuery(searchParams);
    const result = await getBookmarksPage(session.user.id, query);
    return apiPaginated(result);
  } catch (error) {
    const queryError = apiQueryError(error);
    if (queryError) return queryError;

    console.error("Failed to list bookmarks:", error);
    return apiError("Failed to fetch bookmarks", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Authentication required", { status: 401 });
  }

  let body: { postId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", { status: 400 });
  }

  if (!body.postId || typeof body.postId !== "string") {
    return apiError("postId is required", { status: 400 });
  }

  const result = await toggleBookmark(session.user.id, body.postId);
  return apiSuccess(result);
}
