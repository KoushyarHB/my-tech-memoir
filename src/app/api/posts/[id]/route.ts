import {
  getPostById,
  updatePost,
  deletePost,
} from "@/features/blog/server/post-service";
import { apiSuccess, apiError } from "@/lib/api-response";
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
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdatePostInput;
    const post = await updatePost(id, body);
    return apiSuccess(post);
  } catch ( error) {
    console.error("Failed to update post:", error);
    return apiError("Failed to update post", { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deletePost(id);
    return new Response(null, { status: 204 });
  } catch ( error) {
    console.error("Failed to delete post:", error);
    return apiError("Failed to delete post", { status: 500 });
  }
}
