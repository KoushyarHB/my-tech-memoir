import { apiError, apiPaginated, apiQueryError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import { parsePaginationQuery } from "@/shared/lib/pagination";
import {
  createPost,
  getPostsPage,
  PostValidationError,
} from "@/features/blog/server/post-service";
import type { CreatePostRequest } from "@/features/blog/types";

/**
 * GET /api/posts
 *
 * Paginated list, mirroring tms-backend's grid contract:
 *   ?page=1&pageSize=20&search=…&filters=…&sortBy=createdAt&sortOrder=desc
 *
 * `?drafts=true` includes unpublished posts and requires editor access.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeDrafts = searchParams.get("drafts") === "true";

  if (includeDrafts) {
    const session = await requireEditorApi();
    if (!session) {
      return apiError("Forbidden", { status: 403 });
    }
  }

  try {
    const query = parsePaginationQuery(searchParams);
    const result = await getPostsPage(query, { drafts: includeDrafts });
    return apiPaginated(result);
  } catch (error) {
    const queryError = apiQueryError(error);
    if (queryError) return queryError;

    console.error("Failed to list posts:", error);
    return apiError("Failed to fetch posts", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const body = (await request.json()) as CreatePostRequest;
    const post = await createPost(body);
    return apiSuccess(post, { status: 201 });
  } catch (error) {
    if (error instanceof PostValidationError) {
      return apiError(error.message, { status: 400 });
    }

    console.error("Failed to create post:", error);
    return apiError("Failed to create post", { status: 500 });
  }
}
