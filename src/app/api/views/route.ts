import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { recordPostView } from "@/features/blog/server/post-service";

const VIEWER_KEY_MAX = 128;

export async function POST(request: NextRequest) {
  let body: { postId?: string; viewerKey?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", { status: 400 });
  }

  const { postId, viewerKey } = body;

  if (!postId || typeof postId !== "string") {
    return apiError("postId is required", { status: 400 });
  }

  if (
    !viewerKey ||
    typeof viewerKey !== "string" ||
    viewerKey.length > VIEWER_KEY_MAX
  ) {
    return apiError("viewerKey is required", { status: 400 });
  }

  try {
    const result = await recordPostView(postId, viewerKey);
    return apiSuccess(result);
  } catch {
    return apiError("Failed to record view", { status: 500 });
  }
}
