import { db, Prisma } from "@/lib/db";
import { estimateReadingTime } from "../lib/reading-time";
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
  DEFAULT_POST_SORT_FIELD,
  POST_FILTER_FIELDS,
  POST_FILTER_MAP,
  POST_SEARCH_FIELDS,
  POST_SORT_FIELDS,
  type PostSortField,
} from "../constants/post";
import type { CreatePostRequest, GetPostDto, GetPostSummaryDto } from "../types";

/**
 * Blog domain: post data access layer.
 *
 * Two projections, on purpose:
 *   - summary (list endpoints) omits `content`/`contentJson`
 *   - full (detail/editor endpoints) includes them
 *
 * Every list query runs its page and count in one `$transaction`, the same
 * pattern tms-backend's query repositories use.
 */

const SUMMARY_SELECT = {
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
  // Fetched for legacy rows whose reading time was never persisted. It is not
  // part of the DTO, so it never reaches the browser.
  content: true,
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { comments: true } },
} as const;

const FULL_SELECT = {
  ...SUMMARY_SELECT,
  contentJson: true,
  coverImage: true,
} as const;

export type PostSummaryRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  publishedAt: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  readingTime: number | null;
  content: string;
  tags: { tag: { id: string; name: string; slug: string } }[];
  _count: { comments: number };
};

type PostRecord = PostSummaryRecord & {
  contentJson: unknown;
  coverImage: string | null;
};

export function toPostSummaryDto(post: PostSummaryRecord): GetPostSummaryDto {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    published: post.published,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    viewCount: post.viewCount,
    commentCount: post._count.comments,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    readingTime:
      post.readingTime !== null
        ? `${post.readingTime} min read`
        : estimateReadingTime(post.content),
    tags: post.tags.map((entry) => entry.tag),
  };
}

function toDto(post: PostRecord): GetPostDto {
  return {
    ...toPostSummaryDto(post),
    content: post.content,
    contentJson: (post.contentJson as GetPostDto["contentJson"]) ?? null,
    coverImage: post.coverImage,
  };
}

function buildOrderBy(field: PostSortField, order: "asc" | "desc") {
  // `commentCount` is a relation count, not a column.
  if (field === "commentCount") return { comments: { _count: order } };
  return { [field]: order };
}

type ListOptions = {
  publishedOnly?: boolean;
  tagSlug?: string;
};

function buildWhere(query: PaginationQuery, options: ListOptions = {}) {
  const predicates = parseFilters(query.filters, POST_FILTER_FIELDS);
  const fragments = buildFilterWhere(predicates, POST_FILTER_MAP);
  const search = buildSearchWhere(
    query.search,
    query.searchFields?.length
      ? query.searchFields.filter((field) =>
          (POST_SEARCH_FIELDS as readonly string[]).includes(field)
        )
      : POST_SEARCH_FIELDS
  );

  const base: Record<string, unknown> = {};
  if (options.publishedOnly) base.published = true;
  if (options.tagSlug) {
    base.tags = { some: { tag: { slug: options.tagSlug } } };
  }
  if (search) {
    return withFilters({ AND: [base, search] }, fragments);
  }
  return withFilters(base, fragments);
}

export async function findPostsPage(
  query: PaginationQuery,
  options: ListOptions = {}
): Promise<PaginatedResult<GetPostSummaryDto>> {
  const sort = resolveSort<PostSortField>({
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    allowedFields: POST_SORT_FIELDS,
    defaultField: DEFAULT_POST_SORT_FIELD,
    defaultOrder: "desc",
  });

  const where = buildWhere(query, options);

  const [rows, totalItems] = await db.$transaction([
    db.post.findMany({
      where,
      skip: getPaginationSkip(query),
      take: query.pageSize,
      orderBy: buildOrderBy(sort.field, sort.order),
      select: SUMMARY_SELECT,
    }),
    db.post.count({ where }),
  ]);

  return createPaginatedResult(
    (rows as PostSummaryRecord[]).map(toPostSummaryDto),
    totalItems,
    query
  );
}

export async function findPostById(id: string): Promise<GetPostDto | null> {
  const post = (await db.post.findUnique({
    where: { id },
    select: FULL_SELECT,
  })) as PostRecord | null;
  return post ? toDto(post) : null;
}

export async function findPostBySlug(slug: string): Promise<GetPostDto | null> {
  const post = (await db.post.findUnique({
    where: { slug },
    select: FULL_SELECT,
  })) as PostRecord | null;
  return post ? toDto(post) : null;
}

export async function insertPost(
  data: Prisma.PostCreateInput
): Promise<GetPostDto> {
  const post = (await db.post.create({
    data,
    select: FULL_SELECT,
  })) as PostRecord;
  return toDto(post);
}

export async function updatePostRecord(
  id: string,
  data: Prisma.PostUpdateInput
): Promise<GetPostDto> {
  const post = (await db.post.update({
    where: { id },
    data,
    select: FULL_SELECT,
  })) as PostRecord;
  return toDto(post);
}

export async function deletePostRecord(id: string): Promise<void> {
  await db.post.delete({ where: { id } });
}

export async function findPostViewState(
  postId: string
): Promise<{ id: string; published: boolean; viewCount: number } | null> {
  return db.post.findUnique({
    where: { id: postId },
    select: { id: true, published: true, viewCount: true },
  });
}

export async function insertPostView(
  postId: string,
  viewerKey: string
): Promise<void> {
  await db.postView.create({ data: { postId, viewerKey } });
}

export async function incrementPostView(
  postId: string
): Promise<{ viewCount: number }> {
  return db.post.update({
    where: { id: postId },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });
}

export async function findPostViewCount(
  postId: string
): Promise<{ viewCount: number } | null> {
  return db.post.findUnique({
    where: { id: postId },
    select: { viewCount: true },
  });
}

/** Slugs of every published post, for `generateStaticParams`. */
export async function findAllPublishedSlugs(): Promise<{ slug: string }[]> {
  return db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: { slug: true },
  });
}

/** Lightweight existence check for cross-domain validation. */
export async function postExists(postId: string): Promise<boolean> {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  return post !== null;
}

/** Dashboard + admin tiles: counts that would be wasteful to page for. */export async function getPostStats(): Promise<{
  total: number;
  published: number;
  drafts: number;
  views: number;
  comments: number;
}> {
  const [total, published, views, comments] = await db.$transaction([
    db.post.count(),
    db.post.count({ where: { published: true } }),
    db.post.aggregate({ _sum: { viewCount: true } }),
    db.comment.count(),
  ]);

  return {
    total,
    published,
    drafts: total - published,
    views: views._sum.viewCount ?? 0,
    comments,
  };
}
