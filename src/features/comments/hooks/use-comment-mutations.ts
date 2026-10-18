import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { createComment } from "../services/comment-service";
import type { CreateCommentRequest } from "../types";

export function useCommentMutations(postId: string) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: Omit<CreateCommentRequest, "postId">) =>
      createComment({ ...input, postId }),
    onSuccess: () => {
      // Any page of this post's comments may now be stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
    },
  });

  return { createMutation };
}
