import type { GetTagCompactDto } from "@/features/tags/types";
import type { TiptapDocument } from "../document";

/** Blog domain: full post payload (detail + editor). */
export type GetPostDto = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentJson: TiptapDocument | null;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  readingTime: string;
  tags: GetTagCompactDto[];
};
