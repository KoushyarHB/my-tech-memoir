import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import { getModerationStats } from "@/features/comments/server/comment-service";

/** GET /api/comments/moderation/stats — counts for the queue tabs and tiles. */
export async function GET() {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    return apiSuccess(await getModerationStats());
  } catch (error) {
    console.error("Failed to load comment stats:", error);
    return apiError("Failed to load comment stats", { status: 500 });
  }
}
