import {
  AUTHENTICATED_BONUS,
  LINK_TOLERANCE,
  REVIEW_SCORE_THRESHOLD,
  SPAM_PHRASES,
  SPAM_SCORE_THRESHOLD,
  TRUSTED_AUTHOR_BONUS,
  canTransition,
} from "../constants/comment";
import type {
  CommentFlag,
  CommentSignals,
  CommentStatus,
} from "../types";

/**
 * Comments domain: auto-moderation.
 *
 * A small, explainable scoring model rather than a black box. Every flag is
 * visible in the moderation queue, so a reviewer can see *why* a comment was
 * held and override it in one click.
 *
 * Pure functions only — no I/O — so the rules can be tested exhaustively
 * (`npm run verify:moderation`).
 */

const LINK_PATTERN = /(https?:\/\/|www\.)[^\s<>()"']+/gi;
const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/;
const URL_IN_NAME_PATTERN = /(https?:\/\/|www\.)/i;
const REPEATED_CHAR_PATTERN = /(.)\1{7,}/;
const WORD_PATTERN = /[a-z0-9']+/gi;

export type ModerationInput = {
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  /** Author is signed in — accountability lowers the risk score. */
  authenticated?: boolean;
  /** Author already has at least one approved comment. */
  trusted?: boolean;
};

export type ModerationVerdict = CommentSignals & {
  status: CommentStatus;
};

function countLinks(body: string): number {
  return body.match(LINK_PATTERN)?.length ?? 0;
}

function findSpamPhrases(body: string): string[] {
  const lower = body.toLowerCase();
  return SPAM_PHRASES.filter((phrase) => {
    const index = lower.indexOf(phrase);
    if (index < 0) return false;

    // Word-boundary check without regex escaping headaches.
    const before = index === 0 ? " " : lower[index - 1];
    const afterIndex = index + phrase.length;
    const after = afterIndex >= lower.length ? " " : lower[afterIndex];
    return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
  });
}

/** True when the letters in `text` are mostly uppercase and there are enough of them. */
function isShouting(text: string): boolean {
  const letters = text.replace(/[^a-z]/gi, "");
  if (letters.length < 24) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length > 0.7;
}

/** Same character 8+ times, or one word 5+ times. */
function hasRepetition(text: string): boolean {
  if (REPEATED_CHAR_PATTERN.test(text)) return true;

  const counts = new Map<string, number>();
  for (const word of text.match(WORD_PATTERN) ?? []) {
    const normalised = word.toLowerCase();
    if (normalised.length < 3) continue;
    const next = (counts.get(normalised) ?? 0) + 1;
    if (next >= 5) return true;
    counts.set(normalised, next);
  }
  return false;
}

const FLAG_LABELS: Record<CommentFlag, string> = {
  links: "Contains links",
  "spam-phrases": "Contains promotional phrasing",
  shouting: "Mostly uppercase",
  repetition: "Repeated characters or words",
  "url-in-name": "URL in the author name",
  "email-in-body": "Email address in the body",
  "too-short": "Very short",
};

/** Runs the rules and returns a 0–100 risk score with human-readable reasons. */
export function assessComment(input: ModerationInput): CommentSignals {
  const body = (input.body ?? "").trim();
  const flags: CommentFlag[] = [];
  let score = 0;

  const links = countLinks(body);
  if (links > LINK_TOLERANCE) {
    flags.push("links");
    score += links >= 3 ? 55 : 25;
  }

  if (findSpamPhrases(body).length > 0) {
    flags.push("spam-phrases");
    score += 45;
  }

  if (isShouting(body)) {
    flags.push("shouting");
    score += 20;
  }

  if (hasRepetition(body)) {
    flags.push("repetition");
    score += 15;
  }

  if (input.authorName && URL_IN_NAME_PATTERN.test(input.authorName)) {
    flags.push("url-in-name");
    score += 45;
  }

  if (EMAIL_PATTERN.test(body)) {
    flags.push("email-in-body");
    score += 25;
  }

  if (body.length > 0 && body.length < 12) {
    flags.push("too-short");
    score += 10;
  }

  if (input.authenticated) score -= AUTHENTICATED_BONUS;
  if (input.trusted) score -= TRUSTED_AUTHOR_BONUS;

  const clamped = Math.max(0, Math.min(100, score));

  return {
    score: clamped,
    flags,
    reasons: flags.map((flag) => FLAG_LABELS[flag]),
  };
}

/**
 * Turns a score into a status.
 *
 * - `>= SPAM_SCORE_THRESHOLD` → `SPAM` (hidden immediately)
 * - `>= REVIEW_SCORE_THRESHOLD` → `PENDING` (queued for a human)
 * - otherwise → `APPROVED`
 */
export function decideStatus(signals: CommentSignals): CommentStatus {
  if (signals.score >= SPAM_SCORE_THRESHOLD) return "SPAM";
  if (signals.score >= REVIEW_SCORE_THRESHOLD) return "PENDING";
  return "APPROVED";
}

export function moderateComment(input: ModerationInput): ModerationVerdict {
  const signals = assessComment(input);
  return { ...signals, status: decideStatus(signals) };
}

/** Re-exported so callers can validate a transition without importing constants. */
export { canTransition };

/** Guard used by the service before writing a status change. */
export function assertTransition(from: CommentStatus, to: CommentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot move a comment from ${from} to ${to}`);
  }
}
