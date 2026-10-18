/** Comments domain: create payload. */
export type CreateCommentRequest = {
  postId: string;
  body: string;
  authorName?: string;
  authorEmail?: string;
  parentId?: string | null;
};
