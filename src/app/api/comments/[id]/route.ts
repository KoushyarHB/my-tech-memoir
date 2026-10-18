import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import {
  CommentValidationError,
  deleteCommentById,
  getModerationComment,
  moderateCommentById,
} from "@/features/comments/server/comment-service";
import type { UpdateCommentRequest } from "@/features/comments/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/comments/[id] — one moderation row (used by the detail panel). */
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    return apiSuccess(await getModerationComment(id));
  } catch (error) {
    if (error instanceof CommentValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to load comment:", error);
    return apiError("Failed to load comment", { status: 500 });
  }
}

/** PATCH /api/comments/[id] — change status and/or edit the body. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateCommentRequest;
    return apiSuccess(await moderateCommentById(id, body));
  } catch (error) {
    if (error instanceof CommentValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to update comment:", error);
    return apiError("Failed to update comment", { status: 500 });
  }
}

/** DELETE /api/comments/[id] — removes the comment and its replies. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteCommentById(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof CommentValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to delete comment:", error);
    return apiError("Failed to delete comment", { status: 500 });
  }
}
