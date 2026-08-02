export interface CommentPayload {
  id: string;
  body: string;
  authorName: string;
  userId: string | null;
  parentId: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SPAM";
  createdAt: string;
  replies?: CommentPayload[];
}

export interface CommentFormData {
  body: string;
  authorName?: string;
  authorEmail?: string;
  parentId?: string;
}
