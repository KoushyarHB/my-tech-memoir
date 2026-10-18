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
import type { GetCommentDto } from "../types";

/**
 * Comments domain: data access layer.
 *
 * Pagination happens over *root* comments; replies for the current page are
 * fetched in a second query and nested in the service. That keeps page sizes
 * honest (one thread cannot blow up the count) while still returning a tree.
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

export function toCommentDto(comment: CommentRecord): GetCommentDto {
  return {
    id: comment.id,
    body: comment.body,
    authorName: comment.user?.name ?? comment.authorName ?? "Anonymous",
    userId: comment.userId,
    parentId: comment.parentId,
    status: comment.status as GetCommentDto["status"],
    createdAt: comment.createdAt.toISOString(),
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
          where: { parentId: { in: rootIds } },
          orderBy: { createdAt: "asc" },
          select: COMMENT_SELECT,
        })) as CommentRecord[]);

  return createPaginatedResult(
    [...(roots as CommentRecord[]), ...replies].map(toCommentDto),
    totalItems,
    query
  );
}

/** Replies are attached by the service; this returns the flat page. */
export async function insertComment(data: {
  postId: string;
  body: string;
  userId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  parentId: string | null;
  status: "PENDING" | "APPROVED";
}): Promise<GetCommentDto> {
  const comment = (await db.comment.create({
    data,
    select: COMMENT_SELECT,
  })) as CommentRecord;
  return toCommentDto(comment);
}

export async function findCommentById(
  commentId: string
): Promise<{ id: string; userId: string | null } | null> {
  return db.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });
}

export async function deleteCommentRecord(commentId: string): Promise<void> {
  await db.comment.delete({ where: { id: commentId } });
}

export async function getCommentStats(): Promise<{
  total: number;
  pending: number;
}> {
  const [total, pending] = await db.$transaction([
    db.comment.count(),
    db.comment.count({ where: { status: "PENDING" } }),
  ]);
  return { total, pending };
}
