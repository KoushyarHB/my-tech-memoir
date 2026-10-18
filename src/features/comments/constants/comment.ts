import type { FilterFieldMap } from "@/shared/lib/prisma-filter";
import type { CommentStatus } from "../types";

/** Comments domain: query surface + validation limits + moderation rules. */

export const COMMENT_SORT_FIELDS = ["createdAt", "authorName", "status"] as const;
export type CommentSortField = (typeof COMMENT_SORT_FIELDS)[number];
export const DEFAULT_COMMENT_SORT_FIELD: CommentSortField = "createdAt";

export const COMMENT_SEARCH_FIELDS = ["body", "authorName", "authorEmail"] as const;

export const COMMENT_FILTER_FIELDS = [
  "status",
  "postId",
  "userId",
  "authorName",
  "createdAt",
] as const;

export const COMMENT_FILTER_MAP: FilterFieldMap = {
  status: { path: "status", type: "enum" },
  postId: { path: "postId", type: "string", caseSensitive: true },
  userId: { path: "userId", type: "string", caseSensitive: true },
  authorName: { path: "authorName", type: "string" },
  createdAt: { path: "createdAt", type: "date" },
};

/**
 * Statuses visible on the public site.
 *
 * `PENDING` is deliberately excluded: moderation is only meaningful if a
 * pending comment is hidden until a human (or the auto-moderator) approves it.
 */
export const VISIBLE_COMMENT_STATUSES = ["APPROVED"] as const;

export const COMMENT_BODY_MAX_LENGTH = 2000;
export const COMMENT_AUTHOR_NAME_MAX_LENGTH = 100;
export const COMMENT_AUTHOR_EMAIL_MAX_LENGTH = 254;

/** Comments loaded per page on the public post page. */
export const COMMENT_PAGE_SIZE = 10;

/** Moderation queue page size. */
export const MODERATION_PAGE_SIZE = 20;

// ── Status metadata ─────────────────────────────────────────────────

export const COMMENT_STATUSES: readonly CommentStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SPAM",
];

export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SPAM: "Spam",
};

export const COMMENT_STATUS_DESCRIPTIONS: Record<CommentStatus, string> = {
  PENDING: "Waiting for review — hidden from readers",
  APPROVED: "Visible to readers",
  REJECTED: "Hidden, kept for your records",
  SPAM: "Hidden and reported as spam",
};

/**
 * Allowed status transitions.
 *
 * Every status can move to every other one — a false-positive spam catch has
 * to be recoverable — so the only real rule is "no self-transition".
 */
export function canTransition(from: CommentStatus, to: CommentStatus): boolean {
  return from !== to && COMMENT_STATUSES.includes(to);
}

// ── Auto-moderation thresholds ──────────────────────────────────────

/** At or above this score a comment is filed as spam without review. */
export const SPAM_SCORE_THRESHOLD = 60;
/** At or above this score a comment goes to the review queue. */
export const REVIEW_SCORE_THRESHOLD = 25;

/** Penalty applied when the author has previously approved comments. */
export const TRUSTED_AUTHOR_BONUS = 35;
/** Penalty applied when the author is signed in (accountability). */
export const AUTHENTICATED_BONUS = 25;

/**
 * Phrases that are overwhelmingly spam in a technical blog's comment box.
 * Matched case-insensitively on word boundaries.
 */
export const SPAM_PHRASES: readonly string[] = [
  "buy now",
  "click here",
  "free money",
  "make money fast",
  "work from home",
  "seo services",
  "crypto giveaway",
  "casino",
  "viagra",
  "loan approval",
  "increase your traffic",
  "guest post",
  "backlinks",
];

/** How many links are tolerated before a comment is considered link spam. */
export const LINK_TOLERANCE = 1;
