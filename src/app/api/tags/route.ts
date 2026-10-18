import { apiError, apiPaginated, apiQueryError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi, requireEditorApi } from "@/lib/auth-guard";
import { parsePaginationQuery } from "@/shared/lib/pagination";
import { findTagsPage } from "@/features/tags/server/tag-repository";
import {
  createTag,
  TagValidationError,
} from "@/features/tags/server/tag-service";
import type { CreateTagRequest } from "@/features/tags/types";

/**
 * GET /api/tags — paginated tag list (editors and admins).
 */
export async function GET(request: Request) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = parsePaginationQuery(searchParams);
    const result = await findTagsPage(query);
    return apiPaginated(result);
  } catch (error) {
    const queryError = apiQueryError(error);
    if (queryError) return queryError;

    console.error("Failed to list tags:", error);
    return apiError("Failed to fetch tags", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const body = (await request.json()) as CreateTagRequest;
    const tag = await createTag(body);
    return apiSuccess(tag, { status: 201 });
  } catch (error) {
    if (error instanceof TagValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to create tag:", error);
    return apiError("Failed to create tag", { status: 500 });
  }
}
