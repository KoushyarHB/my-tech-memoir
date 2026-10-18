import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import { getTagStats } from "@/features/tags/server/tag-repository";

/** GET /api/tags/stats — aggregate counts for the admin tiles. */
export async function GET() {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    return apiSuccess(await getTagStats());
  } catch (error) {
    console.error("Failed to load tag stats:", error);
    return apiError("Failed to load tag stats", { status: 500 });
  }
}
