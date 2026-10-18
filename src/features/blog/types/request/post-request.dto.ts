import type { TiptapDocument } from "../document";

/** Blog domain: create payload. */
export type CreatePostRequest = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  contentJson?: TiptapDocument;
  coverImage?: string | null;
  published?: boolean;
  tagIds?: string[];
};

/** Blog domain: update payload (all fields optional). */
export type UpdatePostRequest = Partial<CreatePostRequest>;
