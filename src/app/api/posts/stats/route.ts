import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import { getPostStats } from "@/features/blog/server/post-service";
import { getTagStats } from "@/features/tags/server/tag-repository";

/** GET /api/posts/stats — aggregate counts for the admin tiles. */
export async function GET() {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const [stats, tagStats] = await Promise.all([
      getPostStats(),
      getTagStats(),
    ]);
    return apiSuccess({ ...stats, tags: tagStats.total });
  } catch (error) {
    console.error("Failed to load post stats:", error);
    return apiError("Failed to load post stats", { status: 500 });
  }
}
