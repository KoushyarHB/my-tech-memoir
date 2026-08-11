import {
  getPostById,
  updatePost,
  deletePost,
} from "@/features/blog/server/post-service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import type { UpdatePostInput } from "@/features/blog/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return apiError("Post not found", { status: 404 });
  }

  return apiSuccess(post);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as UpdatePostInput;
    const post = await updatePost(id, body);
    return apiSuccess(post);
  } catch (error) {
    console.error("Failed to update post:", error);
    const message = error instanceof Error ? error.message : "Failed to update post";
    if (
      /^(Unsafe link|Invalid |Unsupported |Heading level|Code language|Document content)/i.test(
        message
      )
    ) {
      return apiError(message, { status: 400 });
    }
    return apiError("Failed to update post", { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    await deletePost(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete post:", error);
    return apiError("Failed to delete post", { status: 500 });
  }
}
