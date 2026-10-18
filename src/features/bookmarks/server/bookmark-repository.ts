import { db } from "@/lib/db";
import {
  toPostSummaryDto,
  type PostSummaryRecord,
} from "@/features/blog/server/post-repository";
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
  BOOKMARK_FILTER_FIELDS,
  BOOKMARK_FILTER_MAP,
  BOOKMARK_SEARCH_FIELDS,
  BOOKMARK_SORT_FIELDS,
  DEFAULT_BOOKMARK_SORT_FIELD,
  type BookmarkSortField,
} from "../constants/bookmark";
import type { GetBookmarkDto, ToggleBookmarkDto } from "../types";

/** Bookmarks domain: data access layer. */

const BOOKMARK_POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  published: true,
  publishedAt: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  readingTime: true,
  content: true,
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { comments: true } },
} as const;

type BookmarkRecord = {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
  post: PostSummaryRecord;
};

function toDto(bookmark: BookmarkRecord): GetBookmarkDto {
  return {
    id: bookmark.id,
    postId: bookmark.postId,
    userId: bookmark.userId,
    createdAt: bookmark.createdAt.toISOString(),
    post: toPostSummaryDto(bookmark.post),
  };
}

export async function findBookmarksPage(
  userId: string,
  query: PaginationQuery
): Promise<PaginatedResult<GetBookmarkDto>> {
  const sort = resolveSort<BookmarkSortField>({
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    allowedFields: BOOKMARK_SORT_FIELDS,
    defaultField: DEFAULT_BOOKMARK_SORT_FIELD,
    defaultOrder: "desc",
  });

  const predicates = parseFilters(query.filters, BOOKMARK_FILTER_FIELDS);
  const fragments = buildFilterWhere(predicates, BOOKMARK_FILTER_MAP);
  const search = buildSearchWhere(query.search, BOOKMARK_SEARCH_FIELDS);

  const base: Record<string, unknown> = { userId };
  const where = withFilters(
    search ? { AND: [base, search] } : base,
    fragments
  );

  const [rows, totalItems] = await db.$transaction([
    db.bookmark.findMany({
      where,
      skip: getPaginationSkip(query),
      take: query.pageSize,
      orderBy: { [sort.field]: sort.order },
      select: {
        id: true,
        postId: true,
        userId: true,
        createdAt: true,
        post: { select: BOOKMARK_POST_SELECT },
      },
    }),
    db.bookmark.count({ where }),
  ]);

  return createPaginatedResult(
    (rows as BookmarkRecord[]).map(toDto),
    totalItems,
    query
  );
}

export async function findBookmark(
  userId: string,
  postId: string
): Promise<{ id: string } | null> {
  return db.bookmark.findUnique({
    where: { postId_userId: { userId, postId } },
    select: { id: true },
  });
}

export async function deleteBookmarkRecord(id: string): Promise<void> {
  await db.bookmark.delete({ where: { id } });
}

export async function insertBookmark(
  userId: string,
  postId: string
): Promise<{ id: string }> {
  return db.bookmark.create({
    data: { userId, postId },
    select: { id: true },
  });
}

export async function toggleBookmarkRecord(
  userId: string,
  postId: string
): Promise<ToggleBookmarkDto> {
  const existing = await findBookmark(userId, postId);

  if (existing) {
    await deleteBookmarkRecord(existing.id);
    return { bookmarked: false, bookmarkId: null };
  }

  const bookmark = await insertBookmark(userId, postId);
  return { bookmarked: true, bookmarkId: bookmark.id };
}
