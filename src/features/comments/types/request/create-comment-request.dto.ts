import type { CommentStatus } from "../response/get-comment.dto";

/** Comments domain: create payload. */
export type CreateCommentRequest = {
  postId: string;
  body: string;
  authorName?: string;
  authorEmail?: string;
  parentId?: string | null;
};

/** Comments domain: moderation update. */
export type UpdateCommentRequest = {
  status?: CommentStatus;
  body?: string;
};

/** Comments domain: bulk status change. */
export type BulkModerateCommentsRequest = {
  ids: string[];
  status: CommentStatus;
};

/** Comments domain: staff reply. */
export type ReplyToCommentRequest = {
  body: string;
};
