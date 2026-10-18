export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type PostWithTags = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentJson: TiptapDocument | null;
  coverImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  viewCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  readingTime: string;
};

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentJson: TiptapDocument | null;
  published: boolean;
  publishedAt: Date | null;
  viewCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  readingTime: string;
};

export type CreatePostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  contentJson?: TiptapDocument;
  published?: boolean;
  tagIds?: string[];
};

export type UpdatePostInput = Partial<CreatePostInput>;

/**
 * Serialized post summary as returned by the JSON API (dates are ISO strings).
 * Used by client tables so server-rendered props and refetched data share a type.
 */
export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  publishedAt: string | null;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  readingTime: string;
  tags: Tag[];
};
export * from "./document";
import type { TiptapDocument } from "./document";
