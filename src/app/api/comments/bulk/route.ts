import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import {
  CommentValidationError,
  bulkModerateComments,
} from "@/features/comments/server/comment-service";
import { COMMENT_STATUSES } from "@/features/comments/constants/comment";
import type { BulkModerateCommentsRequest } from "@/features/comments/types";

/**
 * POST /api/comments/bulk
 *
 * Applies one status to many comments. Idempotent: ids already in the target
 * state are reported as skipped rather than failing the batch.
 */
export async function POST(request: Request) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const body = (await request.json()) as BulkModerateCommentsRequest;

    if (!Array.isArray(body.ids)) {
      return apiError("ids must be an array", { status: 400 });
    }
    if (!COMMENT_STATUSES.includes(body.status)) {
      return apiError("Invalid status", { status: 400 });
    }

    const result = await bulkModerateComments(body.ids, body.status);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof CommentValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to bulk moderate comments:", error);
    return apiError("Failed to update comments", { status: 500 });
  }
}
