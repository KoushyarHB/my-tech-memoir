import { api } from "@/lib/api-client";
import type { CommentFormData, CommentPayload } from "../types";

export async function fetchComments(postId: string): Promise<CommentPayload[]> {
  return api.get<CommentPayload[]>(
    `/api/comments?postId=${encodeURIComponent(postId)}`
  );
}

export type CreateCommentInput = CommentFormData & {
  postId: string;
};

export async function createComment(
  input: CreateCommentInput
): Promise<CommentPayload> {
  return api.post<CommentPayload>("/api/comments", input);
}
