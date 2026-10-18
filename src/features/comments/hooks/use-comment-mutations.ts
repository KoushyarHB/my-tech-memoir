import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  COMMENT_STATUS_LABELS,
} from "../constants/comment";
import {
  bulkModerateComments,
  createComment,
  deleteComment,
  replyToComment,
  setCommentStatus,
  updateComment,
} from "../services/comment-service";
import type {
  CommentStatus,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "../types";

/**
 * Comments domain: mutations.
 *
 * Every write invalidates the comments root, which covers the public threads,
 * the moderation queue and the status counts in one shot — the queue tabs and
 * tiles therefore update without a page refresh.
 */
function useInvalidateComments() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}

/** Public: post a comment. */
export function useCommentMutations(postId: string) {
  const invalidate = useInvalidateComments();

  const createMutation = useMutation({
    mutationFn: (input: Omit<CreateCommentRequest, "postId">) =>
      createComment({ ...input, postId }),
    onSuccess: () => invalidate(),
  });

  return { createMutation };
}

/**
 * Moderation: single status change, body edit, bulk, delete and staff reply.
 *
 * Status changes are optimistic — the row flips instantly and rolls back if the
 * request fails — because a moderator clicking through a queue should not wait
 * for a round-trip per comment.
 */
export function useModerationMutations() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateComments();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CommentStatus }) =>
      setCommentStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.all });

      const snapshots = queryClient
        .getQueriesData({ queryKey: queryKeys.comments.all })
        .map(([key, data]) => [key, data] as const);

      // Flip the row in every cached moderation page.
      queryClient.setQueriesData(
        { queryKey: ["comments", "moderation"] },
        (previous: unknown) => {
          const page = previous as
            | { items?: { id: string; status: CommentStatus }[] }
            | undefined;
          if (!page?.items) return previous;

          return {
            ...page,
            items: page.items.map((item) =>
              item.id === id ? { ...item, status } : item
            ),
          };
        }
      );

      return { snapshots };
    },
    onError: (error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.error(getErrorMessage(error, "Failed to update comment"));
    },
    onSuccess: (_data, { status }) => {
      toast.success(`Marked as ${COMMENT_STATUS_LABELS[status].toLowerCase()}`);
    },
    onSettled: () => invalidate(),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: CommentStatus }) =>
      bulkModerateComments(ids, status),
    onSuccess: (result, { status }) => {
      const label = COMMENT_STATUS_LABELS[status].toLowerCase();
      toast.success(
        result.updated === 1
          ? `1 comment marked as ${label}`
          : `${result.updated} comments marked as ${label}`,
        result.skipped > 0
          ? { description: `${result.skipped} already in that state` }
          : undefined
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update comments"));
    },
    onSettled: () => invalidate(),
  });

  const updateBodyMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCommentRequest }) =>
      updateComment(id, input),
    onSuccess: () => {
      toast.success("Comment updated");
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update comment"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      toast.success("Comment deleted");
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete comment"));
    },
    onSettled: () => invalidate(),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      replyToComment(id, body),
    onSuccess: () => {
      toast.success("Reply posted");
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to post reply"));
    },
  });

  return {
    statusMutation,
    bulkMutation,
    updateBodyMutation,
    deleteMutation,
    replyMutation,
  };
}
