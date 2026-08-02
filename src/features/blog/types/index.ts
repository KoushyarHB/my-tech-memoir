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
  coverImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  viewCount: number;
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
  published: boolean;
  publishedAt: Date | null;
  viewCount: number;
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
  published?: boolean;
  tagIds?: string[];
};

export type UpdatePostInput = Partial<CreatePostInput>;
