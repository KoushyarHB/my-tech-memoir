import { db } from "@/lib/db";
import { estimateReadingTime } from "../lib/reading-time";
import { sanitizePostHtml } from "../lib/sanitize-post-html";
import type {
  CreatePostInput,
  PostSummary,
  PostWithTags,
  Tag,
  UpdatePostInput,
} from "../types";

const SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  published: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

const FULL_SELECT = {
  ...SUMMARY_SELECT,
  coverImage: true,
} as const;

type PostWithJoinTags = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: Tag }[];
};

function toSummary(
  p: PostWithJoinTags
): PostSummary {
  const content = sanitizePostHtml(p.content);
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content,
    published: p.published,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    tags: p.tags.map((pt) => pt.tag),
    readingTime: estimateReadingTime(content),
  };
}

function toWithTags(
  p: PostWithJoinTags
): PostWithTags {
  return {
    ...toSummary(p),
    coverImage: p.coverImage,
  };
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const posts = (await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  })) as unknown as PostWithJoinTags[];
  return posts.map(toSummary);
}

export async function getAllPosts(): Promise<PostSummary[]> {
  const posts = (await db.post.findMany({
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  })) as unknown as PostWithJoinTags[];
  return posts.map(toSummary);
}

export async function getPostBySlug(
  slug: string
): Promise<PostWithTags | null> {
  const post = (await db.post.findUnique({
    where: { slug },
    select: FULL_SELECT,
  })) as unknown as PostWithJoinTags | null;
  return post ? toWithTags(post) : null;
}

export async function getPostById(
  id: string
): Promise<PostWithTags | null> {
  const post = (await db.post.findUnique({
    where: { id },
    select: FULL_SELECT,
  })) as unknown as PostWithJoinTags | null;
  return post ? toWithTags(post) : null;
}

export async function createPost(
  input: CreatePostInput
): Promise<PostWithTags> {
  const post = (await db.post.create({
    data: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      content: sanitizePostHtml(input.content),
      published: input.published ?? false,
      publishedAt: input.published ? new Date() : null,
      tags: input.tagIds?.length
        ? {
            create: input.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    },
    select: FULL_SELECT,
  })) as unknown as PostWithJoinTags;
  return toWithTags(post);
}

export async function updatePost(
  id: string,
  input: UpdatePostInput
): Promise<PostWithTags> {
  const data: Record<string, unknown> = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.content !== undefined) data.content = sanitizePostHtml(input.content);
  if (input.published !== undefined) {
    data.published = input.published;
    if (input.published) data.publishedAt = new Date();
  }

  if (input.tagIds !== undefined) {
    data.tags = {
      deleteMany: {},
      create: input.tagIds.map((tagId) => ({
        tag: { connect: { id: tagId } },
      })),
    };
  }

  const post = (await db.post.update({
    where: { id },
    data,
    select: FULL_SELECT,
  })) as unknown as PostWithJoinTags;
  return toWithTags(post);
}

export async function deletePost(id: string): Promise<void> {
  await db.post.delete({ where: { id } });
}

export async function getPostsByTag(
  tagSlug: string
): Promise<PostSummary[]> {
  const posts = (await db.post.findMany({
    where: {
      published: true,
      tags: { some: { tag: { slug: tagSlug } } },
    },
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  })) as unknown as PostWithJoinTags[];
  return posts.map(toSummary);
}

export async function searchPosts(
  query: string
): Promise<PostSummary[]> {
  const posts = (await db.post.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  })) as unknown as PostWithJoinTags[];
  return posts.map(toSummary);
}
