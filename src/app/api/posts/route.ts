import { NextResponse } from "next/server";
import { getPublishedPosts, getAllPosts, createPost } from "@/features/blog/server/post-service";
import { apiSuccess, apiError } from "@/lib/api-response";
import type { CreatePostInput } from "@/features/blog/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeDrafts = searchParams.get("drafts") === "true";

  try {
    const posts = includeDrafts ? await getAllPosts() : await getPublishedPosts();
    return apiSuccess(posts);
  } catch {
    return apiError("Failed to fetch posts", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePostInput;

    if (!body.title || !body.slug || !body.content) {
      return apiError("title, slug, and content are required", { status: 400 });
    }

    const post = await createPost(body);
    return apiSuccess(post, { status: 201 });
  } catch ( error) {
    console.error("Failed to create post:", error);
    return apiError("Failed to create post", { status: 500 });
  }
}
