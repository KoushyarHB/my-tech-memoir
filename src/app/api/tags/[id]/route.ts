import { apiError } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/auth-guard";
import { deleteTag, TagValidationError } from "@/features/tags/server/tag-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * DELETE /api/tags/[id] — remove a tag (admins only).
 *
 * `PostTag` rows cascade with the tag, so posts keep their content and simply
 * lose the label. The tag list and metric tiles refetch client-side.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await requireAdminApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteTag(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof TagValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to delete tag:", error);
    return apiError("Failed to delete tag", { status: 500 });
  }
}
