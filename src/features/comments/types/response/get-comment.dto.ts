/** Comments domain: response DTOs. */

export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "SPAM";

/** @deprecated Kept for the public comment tree; prefer `CommentStatus`. */
export type CommentStatusDto = CommentStatus;

/** A node in the public reply tree. */
export type GetCommentDto = {
  id: string;
  body: string;
  authorName: string;
  userId: string | null;
  parentId: string | null;
  status: CommentStatus;
  createdAt: string;
  replies?: GetCommentDto[];
};

/** Why a comment scored the way it did. Computed, never stored. */
export type CommentFlag =
  | "links"
  | "spam-phrases"
  | "shouting"
  | "repetition"
  | "url-in-name"
  | "email-in-body"
  | "too-short";

export type CommentSignals = {
  score: number;
  flags: CommentFlag[];
  reasons: string[];
};

/** Moderation queue row: adds post/parent context and auto-moderation signals. */
export type GetModerationCommentDto = {
  id: string;
  body: string;
  authorName: string;
  authorEmail: string | null;
  userId: string | null;
  /** Role of the linked account, when the author was signed in. */
  authorRole: "USER" | "EDITOR" | "ADMIN" | null;
  parentId: string | null;
  status: CommentStatus;
  createdAt: string;
  post: { id: string; title: string; slug: string };
  /** Direct reply count, so a thread can be opened without a second request. */
  replyCount: number;
  /** Quoted parent, when this is a reply. */
  parent: { id: string; authorName: string; body: string } | null;
  signals: CommentSignals;
};

/** Counts for the moderation tabs and tiles. */
export type GetCommentStatsDto = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
  /** Comments created in the last 24 hours. */
  lastDay: number;
};

/** Result of a bulk status change. */
export type BulkModerationResultDto = {
  updated: number;
  skipped: number;
};
