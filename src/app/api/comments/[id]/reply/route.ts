import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import {
  CommentValidationError,
  replyAsStaff,
} from "@/features/comments/server/comment-service";
import type { ReplyToCommentRequest } from "@/features/comments/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/comments/[id]/reply
 *
 * Replies as the signed-in editor. The reply is approved immediately and
 * attached to the thread root, so the public tree stays two levels deep.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as ReplyToCommentRequest;
    const reply = await replyAsStaff(id, body, session.user.id);
    return apiSuccess(reply, { status: 201 });
  } catch (error) {
    if (error instanceof CommentValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to post staff reply:", error);
    return apiError("Failed to post reply", { status: 500 });
  }
}
