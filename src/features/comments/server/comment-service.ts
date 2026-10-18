import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import {
  COMMENT_AUTHOR_EMAIL_MAX_LENGTH,
  COMMENT_AUTHOR_NAME_MAX_LENGTH,
  COMMENT_BODY_MAX_LENGTH,
} from "../constants/comment";
import type { CreateCommentRequest, GetCommentDto } from "../types";
import {
  deleteCommentRecord,
  findCommentById,
  findCommentsPage,
  insertComment,
} from "./comment-repository";
import { postExists } from "@/features/blog/server/post-service";

/**
 * Comments domain: business rules.
 *
 * Turns a flat page (roots + their replies) into the nested shape the UI
 * renders, and validates new comments before they are stored.
 */

export class CommentValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CommentValidationError";
    this.status = status;
  }
}

function buildTree(flat: GetCommentDto[]): GetCommentDto[] {
  const map = new Map<string, GetCommentDto>();
  const roots: GetCommentDto[] = [];

  for (const comment of flat) {
    map.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of flat) {
    const node = map.get(comment.id);
    if (!node) continue;

    if (comment.parentId) {
      map.get(comment.parentId)?.replies?.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getCommentsPage(
  postId: string,
  query: PaginationQuery,
  options: { visibleOnly?: boolean } = {}
): Promise<PaginatedResult<GetCommentDto>> {
  const page = await findCommentsPage(postId, query, options);
  return { ...page, items: buildTree(page.items) };
}

export async function createComment(
  input: CreateCommentRequest,
  userId: string | null
): Promise<GetCommentDto> {
  if (!input.postId) {
    throw new CommentValidationError("postId is required");
  }

  const body = (input.body ?? "").trim();

  if (!body) {
    throw new CommentValidationError("body is required");
  }
  if (body.length > COMMENT_BODY_MAX_LENGTH) {
    throw new CommentValidationError(
      `body must be ${COMMENT_BODY_MAX_LENGTH} characters or fewer`
    );
  }

  const authorName = (input.authorName ?? "").trim();
  const authorEmail = (input.authorEmail ?? "").trim();

  if (!userId && !authorName) {
    throw new CommentValidationError(
      "authorName is required for anonymous comments"
    );
  }
  if (authorName.length > COMMENT_AUTHOR_NAME_MAX_LENGTH) {
    throw new CommentValidationError(
      `authorName must be ${COMMENT_AUTHOR_NAME_MAX_LENGTH} characters or fewer`
    );
  }
  if (authorEmail.length > COMMENT_AUTHOR_EMAIL_MAX_LENGTH) {
    throw new CommentValidationError(
      `authorEmail must be ${COMMENT_AUTHOR_EMAIL_MAX_LENGTH} characters or fewer`
    );
  }

  const exists = await postExists(input.postId);
  if (!exists) {
    throw new CommentValidationError("Post not found", 404);
  }

  return insertComment({
    postId: input.postId,
    body,
    userId,
    authorName: userId ? null : authorName || "Anonymous",
    authorEmail: userId ? null : authorEmail || null,
    parentId: input.parentId ?? null,
    status: "APPROVED",
  });
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const comment = await findCommentById(commentId);
  if (!comment || comment.userId !== userId) return false;

  await deleteCommentRecord(commentId);
  return true;
}
