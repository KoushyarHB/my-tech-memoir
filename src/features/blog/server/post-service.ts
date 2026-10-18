import { Prisma } from "@/lib/db";
import { slugify } from "@/shared/lib/slugify";
import {
  POST_CONTENT_MAX_LENGTH,
  POST_EXCERPT_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
} from "../constants/post";
import { sanitizePostHtml } from "../lib/sanitize-post-html";
import { readingTimeMinutes } from "../lib/reading-time";
import { validateTiptapDocument } from "../types/document";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import type {
  CreatePostRequest,
  GetPostDto,
  GetPostSummaryDto,
  UpdatePostRequest,
} from "../types";
import {
  deletePostRecord,
  findAllPublishedSlugs,
  findPostById,
  findPostBySlug,
  findPostViewCount,
  findPostViewState,
  findPostsPage,
  incrementPostView,
  insertPost,
  insertPostView,
  updatePostRecord,
} from "./post-repository";

/**
 * Blog domain: post business rules.
 *
 * Owns sanitisation, document validation, slug derivation and publish
 * bookkeeping. Mirrors tms-backend's command handlers: the repository is pure
 * persistence, this layer is where invariants live.
 */

export class PostValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostValidationError";
  }
}

const UNPUBLISHED_SLUG_PREFIX = "draft-";

function hasBodyText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}

function resolveSlug(inputSlug: string | undefined, title: string): string {
  return (
    (inputSlug ?? "").trim() ||
    slugify(title) ||
    `${UNPUBLISHED_SLUG_PREFIX}${Date.now()}`
  );
}

export async function getPostsPage(
  query: PaginationQuery,
  options: { drafts?: boolean; tagSlug?: string } = {}
): Promise<PaginatedResult<GetPostSummaryDto>> {
  return findPostsPage(query, {
    publishedOnly: !options.drafts,
    tagSlug: options.tagSlug,
  });
}

export async function getPostById(id: string): Promise<GetPostDto | null> {
  return findPostById(id);
}

/** Slugs of every published post, for `generateStaticParams`. */
export async function getPublishedSlugs(): Promise<{ slug: string }[]> {
  return findAllPublishedSlugs();
}

export { getPostStats, postExists } from "./post-repository";

export async function getPostBySlug(slug: string): Promise<GetPostDto | null> {
  return findPostBySlug(slug);
}

export async function createPost(
  input: CreatePostRequest
): Promise<GetPostDto> {
  const title = (input.title ?? "").trim();
  const content = input.content ?? "";

  // Drafts may be title-only or body-only; reject only when both are empty.
  if (!title && !hasBodyText(content)) {
    throw new PostValidationError("Add a title or body before saving");
  }
  if (title.length > POST_TITLE_MAX_LENGTH) {
    throw new PostValidationError(
      `Title must be ${POST_TITLE_MAX_LENGTH} characters or fewer`
    );
  }
  if ((input.excerpt ?? "").length > POST_EXCERPT_MAX_LENGTH) {
    throw new PostValidationError(
      `Excerpt must be ${POST_EXCERPT_MAX_LENGTH} characters or fewer`
    );
  }
  if (content.length > POST_CONTENT_MAX_LENGTH) {
    throw new PostValidationError(
      `Content must be ${POST_CONTENT_MAX_LENGTH} characters or fewer`
    );
  }

  const sanitized = content ? sanitizePostHtml(content) : "<p></p>";
  const slug = resolveSlug(input.slug, title);

  const data: Prisma.PostCreateInput = {
    title,
    slug: slugify(slug),
    excerpt: input.excerpt ?? null,
    content: sanitized,
    contentJson: input.contentJson
      ? (validateTiptapDocument(input.contentJson) as Prisma.InputJsonValue)
      : undefined,
    coverImage: input.coverImage ?? null,
    published: input.published ?? false,
    publishedAt: input.published ? new Date() : null,
    readingTime: readingTimeMinutes(sanitized),
    tags: input.tagIds?.length
      ? {
          create: input.tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        }
      : undefined,
  };

  return insertPost(data);
}

export async function updatePost(
  id: string,
  input: UpdatePostRequest
): Promise<GetPostDto> {
  if (
    input.title !== undefined &&
    input.title.length > POST_TITLE_MAX_LENGTH
  ) {
    throw new PostValidationError(
      `Title must be ${POST_TITLE_MAX_LENGTH} characters or fewer`
    );
  }
  if (
    input.excerpt !== undefined &&
    input.excerpt.length > POST_EXCERPT_MAX_LENGTH
  ) {
    throw new PostValidationError(
      `Excerpt must be ${POST_EXCERPT_MAX_LENGTH} characters or fewer`
    );
  }
  if (
    input.content !== undefined &&
    input.content.length > POST_CONTENT_MAX_LENGTH
  ) {
    throw new PostValidationError(
      `Content must be ${POST_CONTENT_MAX_LENGTH} characters or fewer`
    );
  }

  const data: Prisma.PostUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined) data.slug = slugify(input.slug);
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;

  if (input.content !== undefined) {
    const sanitized = sanitizePostHtml(input.content);
    data.content = sanitized;
    data.readingTime = readingTimeMinutes(sanitized);
  }

  if (input.contentJson !== undefined) {
    data.contentJson = validateTiptapDocument(
      input.contentJson
    ) as Prisma.InputJsonValue;
  }

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

  return updatePostRecord(id, data);
}

export async function deletePost(id: string): Promise<void> {
  await deletePostRecord(id);
}

export async function recordPostView(
  postId: string,
  viewerKey: string
): Promise<{ counted: boolean; viewCount?: number }> {
  const post = await findPostViewState(postId);

  if (!post || !post.published) {
    return { counted: false };
  }

  try {
    await insertPostView(postId, viewerKey);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Re-read so the client can sync the latest count even when not incrementing.
      const current = await findPostViewCount(postId);
      return {
        counted: false,
        viewCount: current?.viewCount ?? post.viewCount,
      };
    }
    throw error;
  }

  const updated = await incrementPostView(postId);
  return { counted: true, viewCount: updated.viewCount };
}
