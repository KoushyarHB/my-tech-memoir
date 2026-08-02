import { db } from "@/lib/db";
import type { CommentPayload } from "../types";

type RawComment = {
  id: string;
  body: string;
  authorName: string | null;
  authorEmail: string | null;
  userId: string | null;
  parentId: string | null;
  status: string;
  createdAt: Date;
  user: { name: string | null; image: string | null } | null;
};

function toPayload(c: RawComment): CommentPayload {
  const authorName = c.user?.name ?? c.authorName ?? "Anonymous";
  return {
    id: c.id,
    body: c.body,
    authorName,
    userId: c.userId,
    parentId: c.parentId,
    status: c.status as CommentPayload["status"],
    createdAt: c.createdAt.toISOString(),
  };
}

function buildTree(flat: CommentPayload[]): CommentPayload[] {
  const map = new Map<string, CommentPayload>();
  const roots: CommentPayload[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getCommentsByPostId(
  postId: string
): Promise<CommentPayload[]> {
  const comments = (await db.comment.findMany({
    where: {
      postId,
      status: { in: ["PENDING", "APPROVED"] },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      authorName: true,
      authorEmail: true,
      userId: true,
      parentId: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  })) as unknown as RawComment[];

  const flat = comments.map(toPayload);
  return buildTree(flat);
}

export async function createComment(params: {
  postId: string;
  body: string;
  userId?: string | null;
  authorName?: string;
  authorEmail?: string;
  parentId?: string | null;
}): Promise<CommentPayload> {
  const comment = (await db.comment.create({
    data: {
      postId: params.postId,
      body: params.body,
      userId: params.userId ?? null,
      authorName: params.userId ? null : (params.authorName ?? "Anonymous"),
      authorEmail: params.userId ? null : (params.authorEmail ?? null),
      parentId: params.parentId ?? null,
      status: "APPROVED",
    },
    select: {
      id: true,
      body: true,
      authorName: true,
      authorEmail: true,
      userId: true,
      parentId: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  })) as unknown as RawComment;

  return toPayload(comment);
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment || comment.userId !== userId) {
    return false;
  }

  await db.comment.delete({ where: { id: commentId } });
  return true;
}
