import { api } from "@/lib/api-client";
import type {
  CreatePostInput,
  PostListItem,
  UpdatePostInput,
} from "../types";

export async function fetchPosts(options?: {
  drafts?: boolean;
}): Promise<PostListItem[]> {
  return api.get<PostListItem[]>(
    options?.drafts ? "/api/posts?drafts=true" : "/api/posts"
  );
}

/** The route handlers return the full post; the editor only needs these. */
export type SavedPost = {
  id: string;
  slug: string;
};

export async function createPost(input: CreatePostInput): Promise<SavedPost> {
  return api.post<SavedPost>("/api/posts", input);
}

export async function updatePost(
  postId: string,
  input: UpdatePostInput
): Promise<SavedPost> {
  return api.put<SavedPost>(`/api/posts/${postId}`, input);
}

export async function deletePost(postId: string): Promise<void> {
  return api.delete(`/api/posts/${postId}`);
}
