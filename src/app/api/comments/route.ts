import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import {
  getCommentsByPostId,
  createComment,
} from "@/features/comments/server/comment-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return apiError("Missing postId query parameter", { status: 400 });
  }

  try {
    const comments = await getCommentsByPostId(postId);
    return apiSuccess(comments);
  } catch {
    return apiError("Failed to fetch comments", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const body = await request.json();
    const { postId, body: commentBody, authorName, authorEmail, parentId } =
      body as {
        postId?: string;
        body?: string;
        authorName?: string;
        authorEmail?: string;
        parentId?: string;
      };

    if (!postId) {
      return apiError("postId is required", { status: 400 });
    }

    if (!commentBody || commentBody.trim().length === 0) {
      return apiError("body is required", { status: 400 });
    }

    if (commentBody.length > 2000) {
      return apiError("body must be 2000 characters or fewer", {
        status: 400,
      });
    }

    if (!userId && !authorName?.trim()) {
      return apiError("authorName is required for anonymous comments", {
        status: 400,
      });
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return apiError("Post not found", { status: 404 });
    }

    const comment = await createComment({
      postId,
      body: commentBody.trim(),
      userId,
      authorName: authorName?.trim() || undefined,
      authorEmail: authorEmail?.trim() || undefined,
      parentId: parentId || null,
    });

    return apiSuccess(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return apiError("Failed to create comment", { status: 500 });
  }
}
