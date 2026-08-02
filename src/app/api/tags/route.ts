import { createTag, listTags } from "@/features/admin/server/tag-service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAdminApi, requireEditorApi } from "@/lib/auth-guard";

export async function GET() {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  const tags = await listTags();
  return apiSuccess(
    tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: tag.postCount,
    }))
  );
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const body = (await request.json()) as { name?: string; slug?: string };
    const tag = await createTag({
      name: body.name ?? "",
      slug: body.slug,
    });
    return apiSuccess(tag, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create tag";
    const status =
      message.includes("required") ||
      message.includes("could not") ||
      message.includes("characters")
        ? 400
        : message.includes("already exists")
          ? 409
          : 500;
    return apiError(message, { status });
  }
}
