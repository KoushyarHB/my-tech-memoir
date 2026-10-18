import { db } from "@/lib/db";
import {
  buildFilterWhere,
  buildSearchWhere,
  withFilters,
} from "@/shared/lib/prisma-filter";
import {
  createPaginatedResult,
  getPaginationSkip,
  parseFilters,
} from "@/shared/lib/pagination";
import { resolveSort } from "@/shared/lib/sort";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import {
  COMMENT_FILTER_FIELDS,
  COMMENT_FILTER_MAP,
  COMMENT_SEARCH_FIELDS,
  COMMENT_SORT_FIELDS,
  DEFAULT_COMMENT_SORT_FIELD,
  VISIBLE_COMMENT_STATUSES,
  type CommentSortField,
} from "../constants/comment";
import { assessComment } from "../lib/moderation";
import type {
  CommentStatus,
  GetCommentDto,
  GetCommentStatsDto,
  GetModerationCommentDto,
} from "../types";

/**
 * Comments domain: data access layer.
 *
 * Two shapes on purpose:
 *   - `findCommentsPage`  — public thread for one post (roots + replies)
 *   - `findModerationPage` — every comment across posts, for the admin queue
 *
 * Auto-moderation signals are computed on read rather than stored, so the
 * rules can improve without a migration or a backfill.
 */

const COMMENT_SELECT = {
  id: true,
  body: true,
  authorName: true,
  authorEmail: true,
  userId: true,
  parentId: true,
  status: true,
  createdAt: true,
  user: { select: { name: true, image: true } },
} as const;

type CommentRecord = {
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

const MODERATION_SELECT = {
  ...COMMENT_SELECT,
  user: { select: { name: true, image: true, role: true } },
  post: { select: { id: true, title: true, slug: true } },
  parent: {
    select: {
      id: true,
      authorName: true,
      body: true,
      user: { select: { name: true } },
    },
  },
  _count: { select: { replies: true } },
} as const;

type ModerationRecord = CommentRecord & {
  user: { name: string | null; image: string | null; role: string } | null;
  post: { id: string; title: string; slug: string };
  parent: {
    id: string;
    authorName: string | null;
    body: string;
    user: { name: string | null } | null;
  } | null;
  _count: { replies: number };
};

function authorNameOf(comment: {
  authorName: string | null;
  user: { name: string | null } | null;
}): string {
  return comment.user?.name ?? comment.authorName ?? "Anonymous";
}

export function toCommentDto(comment: CommentRecord): GetCommentDto {
  return {
    id: comment.id,
    body: comment.body,
    authorName: authorNameOf(comment),
    userId: comment.userId,
    parentId: comment.parentId,
    status: comment.status as CommentStatus,
    createdAt: comment.createdAt.toISOString(),
  };
}

function toModerationDto(comment: ModerationRecord): GetModerationCommentDto {
  const authorName = authorNameOf(comment);
  const signals = assessComment({
    body: comment.body,
    authorName,
    authorEmail: comment.authorEmail,
    authenticated: comment.userId !== null,
  });

  return {
    id: comment.id,
    body: comment.body,
    authorName,
    authorEmail: comment.authorEmail,
    userId: comment.userId,
    authorRole: (comment.user?.role as GetModerationCommentDto["authorRole"]) ?? null,
    parentId: comment.parentId,
    status: comment.status as CommentStatus,
    createdAt: comment.createdAt.toISOString(),
    post: comment.post,
    replyCount: comment._count.replies,
    parent: comment.parent
      ? {
          id: comment.parent.id,
          authorName: authorNameOf(comment.parent),
          body: comment.parent.body,
        }
      : null,
    signals,
  };
}

type ListOptions = {
  /** Restrict to statuses visible on the public site. */
  visibleOnly?: boolean;
};

function buildWhere(
  postId: string,
  query: PaginationQuery,
  options: ListOptions
) {
  const predicates = parseFilters(query.filters, COMMENT_FILTER_FIELDS);
  const fragments = buildFilterWhere(predicates, COMMENT_FILTER_MAP);
  const search = buildSearchWhere(query.search, COMMENT_SEARCH_FIELDS);

  const base: Record<string, unknown> = {
    postId,
    parentId: null,
  };
  if (options.visibleOnly) {
    base.status = { in: VISIBLE_COMMENT_STATUSES };
  }

  return withFilters(search ? { AND: [base, search] } : base, fragments);
}

export async function findCommentsPage(
  postId: string,
  query: PaginationQuery,
  options: ListOptions = {}
): Promise<PaginatedResult<GetCommentDto>> {
  const sort = resolveSort<CommentSortField>({
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    allowedFields: COMMENT_SORT_FIELDS,
    defaultField: DEFAULT_COMMENT_SORT_FIELD,
    defaultOrder: "asc",
  });

  const where = buildWhere(postId, query, options);

  const [roots, totalItems] = await db.$transaction([
    db.comment.findMany({
      where,
      skip: getPaginationSkip(query),
      take: query.pageSize,
      orderBy: { [sort.field]: sort.order },
      select: COMMENT_SELECT,
    }),
    db.comment.count({ where }),
  ]);

  const rootIds = (roots as CommentRecord[]).map((comment) => comment.id);

  const replies =
    rootIds.length === 0
      ? []
      : ((await db.comment.findMany({
          where: {
            parentId: { in: rootIds },
            status: { in: [...VISIBLE_COMMENT_STATUSES] },
          },
          orderBy: { createdAt: "asc" },
          select: COMMENT_SELECT,
        })) as unknown as CommentRecord[]);

  return createPaginatedResult(
    [...(roots as CommentRecord[]), ...replies].map(toCommentDto),
    totalItems,
    query
  );
}

/**
 * Moderation queue: every comment, newest first by default, with the post it
 * belongs to and its parent context.
 */
export async function findModerationPage(
  query: PaginationQuery
): Promise<PaginatedResult<GetModerationCommentDto>> {
  const sort = resolveSort<CommentSortField>({
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    allowedFields: COMMENT_SORT_FIELDS,
    defaultField: DEFAULT_COMMENT_SORT_FIELD,
    defaultOrder: "desc",
  });

  const predicates = parseFilters(query.filters, COMMENT_FILTER_FIELDS);
  const fragments = buildFilterWhere(predicates, COMMENT_FILTER_MAP);
  const search = buildSearchWhere(query.search, COMMENT_SEARCH_FIELDS);
  const where = withFilters(search ? { AND: [search] } : {}, fragments);

  const [rows, totalItems] = await db.$transaction([
    db.comment.findMany({
      where,
      skip: getPaginationSkip(query),
      take: query.pageSize,
      orderBy: { [sort.field]: sort.order },
      select: MODERATION_SELECT,
    }),
    db.comment.count({ where }),
  ]);

  return createPaginatedResult(
    (rows as ModerationRecord[]).map(toModerationDto),
    totalItems,
    query
  );
}

export async function findModerationComment(
  id: string
): Promise<GetModerationCommentDto | null> {
  const comment = (await db.comment.findUnique({
    where: { id },
    select: MODERATION_SELECT,
  })) as ModerationRecord | null;

  return comment ? toModerationDto(comment) : null;
}

/** Replies to a comment, for the detail panel. */
export async function findReplies(
  parentId: string
): Promise<GetModerationCommentDto[]> {
  const rows = (await db.comment.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
    select: MODERATION_SELECT,
  })) as ModerationRecord[];

  return rows.map(toModerationDto);
}

export async function insertComment(data: {
  postId: string;
  body: string;
  userId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  parentId: string | null;
  status: CommentStatus;
}): Promise<GetCommentDto> {
  const comment = (await db.comment.create({
    data,
    select: COMMENT_SELECT,
  })) as CommentRecord;
  return toCommentDto(comment);
}

export async function findCommentById(
  commentId: string
): Promise<{
  id: string;
  userId: string | null;
  status: CommentStatus;
  parentId: string | null;
  postId: string;
} | null> {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, status: true, parentId: true, postId: true },
  });

  return comment
    ? { ...comment, status: comment.status as CommentStatus }
    : null;
}

export async function updateCommentRecord(
  id: string,
  data: { status?: CommentStatus; body?: string }
): Promise<GetModerationCommentDto | null> {
  const comment = (await db.comment.update({
    where: { id },
    data,
    select: MODERATION_SELECT,
  })) as ModerationRecord;

  return toModerationDto(comment);
}

export async function bulkUpdateStatus(
  ids: string[],
  status: CommentStatus
): Promise<number> {
  const result = await db.comment.updateMany({
    where: { id: { in: ids }, status: { not: status } },
    data: { status },
  });
  return result.count;
}

export async function deleteCommentRecord(commentId: string): Promise<void> {
  await db.comment.delete({ where: { id: commentId } });
}

/** True when this author already has an approved comment. */
export async function hasApprovedHistory(input: {
  userId: string | null;
  email: string | null;
}): Promise<boolean> {
  const filters: Record<string, unknown>[] = [];
  if (input.userId) filters.push({ userId: input.userId });
  if (input.email) filters.push({ authorEmail: input.email });
  if (filters.length === 0) return false;

  const found = await db.comment.findFirst({
    where: { status: "APPROVED", OR: filters },
    select: { id: true },
  });

  return found !== null;
}

/** Cheap count for the sidebar badge. */
export async function countPendingComments(): Promise<number> {
  return db.comment.count({ where: { status: "PENDING" } });
}

export async function getCommentStats(): Promise<GetCommentStatsDto> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [total, pending, approved, rejected, spam, lastDay] =
    await db.$transaction([
      db.comment.count(),
      db.comment.count({ where: { status: "PENDING" } }),
      db.comment.count({ where: { status: "APPROVED" } }),
      db.comment.count({ where: { status: "REJECTED" } }),
      db.comment.count({ where: { status: "SPAM" } }),
      db.comment.count({ where: { createdAt: { gte: dayAgo } } }),
    ]);

  return { total, pending, approved, rejected, spam, lastDay };
}
