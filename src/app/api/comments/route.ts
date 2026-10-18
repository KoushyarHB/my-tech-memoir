import { auth } from "@/auth";
import { apiError, apiPaginated, apiQueryError, apiSuccess } from "@/lib/api-response";
import { parsePaginationQuery } from "@/shared/lib/pagination";
import {
  CommentValidationError,
  createComment,
  getCommentsPage,
} from "@/features/comments/server/comment-service";
import type { CreateCommentRequest } from "@/features/comments/types";

/**
 * GET /api/comments?postId=…
 *
 * Paginated over root comments; replies for the current page are nested in
 * each item. Same `page`/`pageSize`/`search`/`sortBy` contract as every other
 * list endpoint.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return apiError("Missing postId query parameter", { status: 400 });
  }

  try {
    const query = parsePaginationQuery(searchParams);
    const result = await getCommentsPage(postId, query, { visibleOnly: true });
    return apiPaginated(result);
  } catch (error) {
    const queryError = apiQueryError(error);
    if (queryError) return queryError;

    console.error("Failed to list comments:", error);
    return apiError("Failed to fetch comments", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const body = (await request.json()) as CreateCommentRequest;

    const comment = await createComment(body, userId);
    return apiSuccess(comment, { status: 201 });
  } catch (error) {
    if (error instanceof CommentValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to create comment:", error);
    return apiError("Failed to create comment", { status: 500 });
  }
}
