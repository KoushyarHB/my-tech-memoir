import { getPublishedPosts, getAllPosts, createPost } from "@/features/blog/server/post-service";
import { slugify } from "@/features/blog/lib/slugify";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import type { CreatePostInput } from "@/features/blog/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeDrafts = searchParams.get("drafts") === "true";

  try {
    if (includeDrafts) {
      const session = await requireEditorApi();
      if (!session) {
        return apiError("Forbidden", { status: 403 });
      }
      const posts = await getAllPosts();
      return apiSuccess(posts);
    }
    const posts = await getPublishedPosts();
    return apiSuccess(posts);
  } catch {
    return apiError("Failed to fetch posts", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const body = (await request.json()) as CreatePostInput;
    const title = (body.title ?? "").trim();
    const content = body.content ?? "";
    const hasBody =
      content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;

    // Allow title-only or body-only drafts; reject only when both are empty
    if (!title && !hasBody) {
      return apiError("Add a title or body before saving", { status: 400 });
    }

    const slug =
      (body.slug ?? "").trim() || slugify(title) || `draft-${Date.now()}`;

    const post = await createPost({
      ...body,
      title,
      slug,
      content: content || "<p></p>",
    });
    return apiSuccess(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return apiError("Failed to create post", { status: 500 });
  }
}
