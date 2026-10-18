import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  createPost,
  deletePost,
  updatePost,
} from "../services/post-service";
import type {
  CreatePostRequest,
  GetPostDto,
  UpdatePostRequest,
} from "../types";

export type SavePostVariables = {
  postId?: string;
  input: CreatePostRequest | UpdatePostRequest;
};

/**
 * Blog domain: write operations.
 *
 * Both hooks invalidate the posts root so every open page (and the metric
 * tiles derived from it) refetches; the editor keeps its own local state and
 * only needs the saved DTO back.
 */
export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, input }: SavePostVariables): Promise<GetPostDto> =>
      postId
        ? updatePost(postId, input as UpdatePostRequest)
        : createPost(input as CreatePostRequest),
    onSuccess: (post) => {
      queryClient.setQueryData(queryKeys.posts.detail(post.id), post);
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to save. Please try again."));
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (_data, postId) => {
      queryClient.removeQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      toast.success("Post deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete post"));
    },
  });
}
