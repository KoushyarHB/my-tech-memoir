import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import { getModerationThread } from "@/features/comments/server/comment-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/comments/[id]/thread — replies to a comment, for the detail panel. */
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    return apiSuccess(await getModerationThread(id));
  } catch (error) {
    console.error("Failed to load comment thread:", error);
    return apiError("Failed to load thread", { status: 500 });
  }
}
