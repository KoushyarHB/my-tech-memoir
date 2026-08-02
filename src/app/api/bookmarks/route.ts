import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import {
  toggleBookmark,
  isBookmarked,
  getBookmarksByUserId,
} from "@/features/bookmarks/server/bookmark-service";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Authentication required", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (postId) {
    const bookmarked = await isBookmarked(session.user.id, postId);
    return apiSuccess({ bookmarked });
  }

  const bookmarks = await getBookmarksByUserId(session.user.id);
  return apiSuccess(bookmarks);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Authentication required", { status: 401 });
  }

  let body: { postId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", { status: 400 });
  }

  if (!body.postId || typeof body.postId !== "string") {
    return apiError("postId is required", { status: 400 });
  }

  const result = await toggleBookmark(session.user.id, body.postId);
  return apiSuccess(result);
}
