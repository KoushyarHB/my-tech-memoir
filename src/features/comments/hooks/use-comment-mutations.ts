import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  createComment,
  type CreateCommentInput,
} from "../services/comment-service";

export function useCommentMutations(postId: string) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: Omit<CreateCommentInput, "postId">) =>
      createComment({ ...input, postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byPost(postId),
      });
    },
  });

  return { createMutation };
}
