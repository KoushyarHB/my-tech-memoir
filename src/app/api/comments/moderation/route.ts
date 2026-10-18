import { apiError, apiPaginated, apiQueryError } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import { parsePaginationQuery } from "@/shared/lib/pagination";
import { getModerationPage } from "@/features/comments/server/comment-service";

/**
 * GET /api/comments/moderation
 *
 * The moderation queue: every comment across every post, with post + parent
 * context and auto-moderation signals. Editors and admins only.
 */
export async function GET(request: Request) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = parsePaginationQuery(searchParams);
    return apiPaginated(await getModerationPage(query));
  } catch (error) {
    const queryError = apiQueryError(error);
    if (queryError) return queryError;

    console.error("Failed to list comments for moderation:", error);
    return apiError("Failed to load comments", { status: 500 });
  }
}
