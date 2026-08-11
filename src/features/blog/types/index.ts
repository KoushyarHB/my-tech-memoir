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
export * from "./document";
import type { TiptapDocument } from "./document";
