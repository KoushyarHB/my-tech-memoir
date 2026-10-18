import { postExists } from "@/features/blog/server/post-service";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import {
  COMMENT_AUTHOR_EMAIL_MAX_LENGTH,
  COMMENT_AUTHOR_NAME_MAX_LENGTH,
  COMMENT_BODY_MAX_LENGTH,
  canTransition,
} from "../constants/comment";
import { moderateComment } from "../lib/moderation";
import type {
  BulkModerationResultDto,
  CommentStatus,
  CreateCommentRequest,
  GetCommentDto,
  GetCommentStatsDto,
  GetModerationCommentDto,
  ReplyToCommentRequest,
  UpdateCommentRequest,
} from "../types";
import {
  bulkUpdateStatus,
  countPendingComments,
  deleteCommentRecord,
  findCommentById,
  findCommentsPage,
  findModerationComment,
  findModerationPage,
  findReplies,
  getCommentStats,
  hasApprovedHistory,
  insertComment,
  updateCommentRecord,
} from "./comment-repository";

/**
 * Comments domain: business rules.
 *
 * Owns validation, auto-moderation and moderation transitions. The repository
 * is pure persistence; the route handlers only translate HTTP.
 */

export class CommentValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CommentValidationError";
    this.status = status;
  }
}

function validateBody(raw: string): string {
  const body = (raw ?? "").trim();

  if (!body) {
    throw new CommentValidationError("body is required");
  }
  if (body.length > COMMENT_BODY_MAX_LENGTH) {
    throw new CommentValidationError(
      `body must be ${COMMENT_BODY_MAX_LENGTH} characters or fewer`
    );
  }

  return body;
}

// ── Public thread ───────────────────────────────────────────────────

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

/**
 * Creates a comment and decides its initial status.
 *
 * The auto-moderator replaces the previous blanket approval: clean comments
 * still appear instantly, suspicious ones queue for review, and obvious spam
 * is hidden without a human ever seeing it.
 */
export async function createComment(
  input: CreateCommentRequest,
  userId: string | null
): Promise<GetCommentDto> {
  if (!input.postId) {
    throw new CommentValidationError("postId is required");
  }

  const body = validateBody(input.body);
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

  const trusted = await hasApprovedHistory({
    userId,
    email: authorEmail || null,
  });

  const verdict = moderateComment({
    body,
    authorName,
    authorEmail: authorEmail || null,
    authenticated: userId !== null,
    trusted,
  });

  return insertComment({
    postId: input.postId,
    body,
    userId,
    authorName: userId ? null : authorName || "Anonymous",
    authorEmail: userId ? null : authorEmail || null,
    parentId: input.parentId ?? null,
    status: verdict.status,
  });
}

export async function deleteOwnComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const comment = await findCommentById(commentId);
  if (!comment || comment.userId !== userId) return false;

  await deleteCommentRecord(commentId);
  return true;
}

// ── Moderation queue ────────────────────────────────────────────────

export async function getModerationPage(
  query: PaginationQuery
): Promise<PaginatedResult<GetModerationCommentDto>> {
  return findModerationPage(query);
}

export async function getModerationComment(
  id: string
): Promise<GetModerationCommentDto> {
  const comment = await findModerationComment(id);
  if (!comment) {
    throw new CommentValidationError("Comment not found", 404);
  }
  return comment;
}

export async function getModerationThread(
  id: string
): Promise<GetModerationCommentDto[]> {
  return findReplies(id);
}

export async function getModerationStats(): Promise<GetCommentStatsDto> {
  return getCommentStats();
}

/** Pending count for the admin sidebar badge. */
export async function getPendingCommentCount(): Promise<number> {
  return countPendingComments();
}

/**
 * Applies a status change and/or body edit.
 *
 * Re-running the moderator on an edited body keeps the signals honest: a
 * moderator who rewrites a link out of a held comment sees the score drop.
 */
export async function moderateCommentById(
  id: string,
  input: UpdateCommentRequest
): Promise<GetModerationCommentDto> {
  const existing = await findCommentById(id);
  if (!existing) {
    throw new CommentValidationError("Comment not found", 404);
  }

  const data: { status?: CommentStatus; body?: string } = {};

  if (input.status !== undefined) {
    if (!canTransition(existing.status, input.status)) {
      throw new CommentValidationError(
        `A comment cannot move from ${existing.status} to ${input.status}`
      );
    }
    data.status = input.status;
  }

  if (input.body !== undefined) {
    data.body = validateBody(input.body);
  }

  if (Object.keys(data).length === 0) {
    throw new CommentValidationError("Nothing to update");
  }

  const updated = await updateCommentRecord(id, data);
  if (!updated) {
    throw new CommentValidationError("Comment not found", 404);
  }
  return updated;
}

/**
 * Bulk status change.
 *
 * `updated` counts rows whose status actually changed; `skipped` covers ids
 * that were already in the target state or no longer exist. Bulk moderation is
 * idempotent, so a double-click is harmless.
 */
export async function bulkModerateComments(
  ids: string[],
  status: CommentStatus
): Promise<BulkModerationResultDto> {
  const unique = Array.from(new Set(ids.filter(Boolean)));

  if (unique.length === 0) {
    throw new CommentValidationError("ids must contain at least one comment");
  }
  if (unique.length > 100) {
    throw new CommentValidationError("At most 100 comments per request");
  }

  const updated = await bulkUpdateStatus(unique, status);
  return { updated, skipped: unique.length - updated };
}

export async function deleteCommentById(id: string): Promise<void> {
  const existing = await findCommentById(id);
  if (!existing) {
    throw new CommentValidationError("Comment not found", 404);
  }
  await deleteCommentRecord(id);
}

/**
 * Staff reply.
 *
 * Always approved (a signed-in editor is the trust signal) and attached to the
 * thread root so the public tree stays two levels deep.
 */
export async function replyAsStaff(
  parentId: string,
  input: ReplyToCommentRequest,
  userId: string
): Promise<GetCommentDto> {
  const parent = await findCommentById(parentId);
  if (!parent) {
    throw new CommentValidationError("Comment not found", 404);
  }

  const body = validateBody(input.body);

  return insertComment({
    postId: parent.postId,
    body,
    userId,
    authorName: null,
    authorEmail: null,
    parentId: parent.parentId ?? parent.id,
    status: "APPROVED",
  });
}
