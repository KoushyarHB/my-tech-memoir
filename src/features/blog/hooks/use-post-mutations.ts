import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  createPost,
  deletePost,
  updatePost,
  type SavedPost,
} from "../services/post-service";
import type { CreatePostInput, UpdatePostInput } from "../types";

export type SavePostVariables = {
  postId?: string;
  input: CreatePostInput | UpdatePostInput;
};

export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, input }: SavePostVariables): Promise<SavedPost> =>
      postId
        ? updatePost(postId, input as UpdatePostInput)
        : createPost(input as CreatePostInput),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      if (post?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.posts.detail(post.id),
        });
      }
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
