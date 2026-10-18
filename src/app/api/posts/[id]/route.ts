import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import {
  deletePost,
  getPostById,
  PostValidationError,
  updatePost,
} from "@/features/blog/server/post-service";
import type { UpdatePostRequest } from "@/features/blog/types";

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
    const body = (await request.json()) as UpdatePostRequest;
    const post = await updatePost(id, body);
    return apiSuccess(post);
  } catch (error) {
    if (error instanceof PostValidationError) {
      return apiError(error.message, { status: 400 });
    }

    console.error("Failed to update post:", error);
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
