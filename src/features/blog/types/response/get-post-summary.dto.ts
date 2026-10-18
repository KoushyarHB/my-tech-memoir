import type { GetTagCompactDto } from "@/features/tags/types";

/**
 * Blog domain: list payload.
 *
 * Deliberately excludes `content` and `contentJson` — a page of 20 posts would
 * otherwise ship megabytes the table never renders. Use `GetPostDto` for the
 * single-post endpoints.
 */
export type GetPostSummaryDto = {
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
  tags: GetTagCompactDto[];
};
