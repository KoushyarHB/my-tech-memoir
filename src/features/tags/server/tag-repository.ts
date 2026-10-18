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
  DEFAULT_TAG_SORT_FIELD,
  TAG_FILTER_FIELDS,
  TAG_FILTER_MAP,
  TAG_SEARCH_FIELDS,
  TAG_SORT_FIELDS,
  type TagSortField,
} from "../constants/tag";
import type { GetTagCompactDto, GetTagDto } from "../types";

/**
 * Tags domain: data access layer.
 *
 * Mirrors tms-backend's `*QueryRepository`: it returns DTOs (never Prisma
 * records), performs a single `$transaction` for the page + count pair, and
 * knows nothing about HTTP.
 */

const TAG_SELECT = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  _count: { select: { posts: true } },
} as const;

type TagRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  _count: { posts: number };
};

function toDto(tag: TagRecord): GetTagDto {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    postCount: tag._count.posts,
    createdAt: tag.createdAt.toISOString(),
  };
}

function buildOrderBy(field: TagSortField, order: "asc" | "desc") {
  if (field === "postCount") return { posts: { _count: order } };
  return { [field]: order };
}

function buildWhere(query: PaginationQuery) {
  const predicates = parseFilters(query.filters, TAG_FILTER_FIELDS);
  const fragments = buildFilterWhere(predicates, TAG_FILTER_MAP);
  const search = buildSearchWhere(query.search, TAG_SEARCH_FIELDS);
  return withFilters(search ? { AND: [search] } : {}, fragments);
}

export async function findTagsPage(
  query: PaginationQuery
): Promise<PaginatedResult<GetTagDto>> {
  const sort = resolveSort<TagSortField>({
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    allowedFields: TAG_SORT_FIELDS,
    defaultField: DEFAULT_TAG_SORT_FIELD,
    defaultOrder: "asc",
  });

  const where = buildWhere(query);

  const [rows, totalItems] = await db.$transaction([
    db.tag.findMany({
      where,
      skip: getPaginationSkip(query),
      take: query.pageSize,
      orderBy: buildOrderBy(sort.field, sort.order),
      select: TAG_SELECT,
    }),
    db.tag.count({ where }),
  ]);

  return createPaginatedResult(
    (rows as TagRecord[]).map(toDto),
    totalItems,
    query
  );
}

/** Every tag, for pickers and the post editor. */
export async function findAllTags(): Promise<GetTagCompactDto[]> {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return tags;
}

export async function findTagById(id: string): Promise<GetTagDto | null> {
  const tag = (await db.tag.findUnique({
    where: { id },
    select: TAG_SELECT,
  })) as TagRecord | null;
  return tag ? toDto(tag) : null;
}

export async function findTagBySlug(slug: string): Promise<GetTagDto | null> {
  const tag = (await db.tag.findUnique({
    where: { slug },
    select: TAG_SELECT,
  })) as TagRecord | null;
  return tag ? toDto(tag) : null;
}

export async function findTagByNameInsensitive(
  name: string
): Promise<{ id: string; name: string; slug: string } | null> {
  return db.tag.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true, slug: true },
  });
}

export async function findTagBySlugExact(
  slug: string
): Promise<{ id: string; name: string; slug: string } | null> {
  return db.tag.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
}

export async function insertTag(input: {
  name: string;
  slug: string;
}): Promise<GetTagDto> {
  const tag = (await db.tag.create({
    data: input,
    select: TAG_SELECT,
  })) as TagRecord;
  return toDto(tag);
}

/** Aggregates used by the admin metric tiles. */
export async function getTagStats(): Promise<{
  total: number;
  used: number;
  assignments: number;
}> {
  const [total, assignmentsByTag] = await db.$transaction([
    db.tag.count(),
    db.postTag.findMany({ select: { tagId: true } }),
  ]);

  return {
    total,
    used: new Set(assignmentsByTag.map((row) => row.tagId)).size,
    assignments: assignmentsByTag.length,
  };
}
