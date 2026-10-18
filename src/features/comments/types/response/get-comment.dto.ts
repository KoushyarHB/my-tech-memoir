/** Comments domain: response DTO (a node in the reply tree). */
export type CommentStatusDto = "PENDING" | "APPROVED" | "REJECTED" | "SPAM";

export type GetCommentDto = {
  id: string;
  body: string;
  authorName: string;
  userId: string | null;
  parentId: string | null;
  status: CommentStatusDto;
  createdAt: string;
  replies?: GetCommentDto[];
};
