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
  DEFAULT_USER_SORT_FIELD,
  USER_COUNT_SORT_FIELDS,
  USER_FILTER_FIELDS,
  USER_FILTER_MAP,
  USER_SEARCH_FIELDS,
  USER_SORT_FIELDS,
  type UserSortField,
} from "../constants/user";
import type { GetUserDto } from "../types";

/** Users domain: data access layer. */

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  image: true,
  bio: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  accounts: { select: { provider: true } },
  _count: {
    select: {
      authoredPosts: true,
      bookmarks: true,
      comments: true,
      translations: true,
    },
  },
} as const;

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  role: GetUserDto["role"];
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  accounts: { provider: string }[];
  _count: {
    authoredPosts: number;
    bookmarks: number;
    comments: number;
    translations: number;
  };
};

export function toUserDto(user: UserRecord): GetUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    bio: user.bio,
    role: user.role,
    emailVerified: user.emailVerified !== null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    providers: user.accounts.map((account) => account.provider),
    postCount: user._count.authoredPosts,
    bookmarkCount: user._count.bookmarks,
    commentCount: user._count.comments,
    translationCount: user._count.translations,
  };
}

function buildOrderBy(field: UserSortField, order: "asc" | "desc") {
  if (field in USER_COUNT_SORT_FIELDS) {
    const relation =
      USER_COUNT_SORT_FIELDS[
        field as keyof typeof USER_COUNT_SORT_FIELDS
      ];
    return { [relation]: { _count: order } };
  }
  return { [field]: order };
}

export async function findUsersPage(
  query: PaginationQuery
): Promise<PaginatedResult<GetUserDto>> {
  const sort = resolveSort<UserSortField>({
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    allowedFields: USER_SORT_FIELDS,
    defaultField: DEFAULT_USER_SORT_FIELD,
    defaultOrder: "desc",
  });

  const predicates = parseFilters(query.filters, USER_FILTER_FIELDS);
  const fragments = buildFilterWhere(predicates, USER_FILTER_MAP);
  const search = buildSearchWhere(query.search, USER_SEARCH_FIELDS);
  const where = withFilters(search ? { AND: [search] } : {}, fragments);

  const [rows, totalItems] = await db.$transaction([
    db.user.findMany({
      where,
      skip: getPaginationSkip(query),
      take: query.pageSize,
      orderBy: buildOrderBy(sort.field, sort.order),
      select: USER_SELECT,
    }),
    db.user.count({ where }),
  ]);

  return createPaginatedResult(
    (rows as UserRecord[]).map(toUserDto),
    totalItems,
    query
  );
}

export async function findUserById(id: string): Promise<GetUserDto | null> {
  const user = (await db.user.findUnique({
    where: { id },
    select: USER_SELECT,
  })) as UserRecord | null;
  return user ? toUserDto(user) : null;
}

export async function updateUserRoleRecord(
  id: string,
  role: GetUserDto["role"]
): Promise<GetUserDto> {
  const user = (await db.user.update({
    where: { id },
    data: { role },
    select: USER_SELECT,
  })) as UserRecord;
  return toUserDto(user);
}

export async function countAdmins(): Promise<number> {
  return db.user.count({ where: { role: "ADMIN" } });
}

/** Aggregates for the admin user tiles. */
export async function getUserStats(): Promise<{
  total: number;
  admin: number;
  editor: number;
  user: number;
  posts: number;
  bookmarks: number;
  comments: number;
}> {
  const [total, admin, editor, user, counts] = await db.$transaction([
    db.user.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { role: "EDITOR" } }),
    db.user.count({ where: { role: "USER" } }),
    db.postAuthor.count(),
  ]);

  const [bookmarks, comments] = await db.$transaction([
    db.bookmark.count(),
    db.comment.count(),
  ]);

  return {
    total,
    admin,
    editor,
    user,
    posts: counts,
    bookmarks,
    comments,
  };
}
