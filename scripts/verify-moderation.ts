import assert from "node:assert/strict";
import {
  assessComment,
  decideStatus,
  moderateComment,
  canTransition,
} from "../src/features/comments/lib/moderation";
import {
  AUTHENTICATED_BONUS,
  LINK_TOLERANCE,
  REVIEW_SCORE_THRESHOLD,
  SPAM_SCORE_THRESHOLD,
  TRUSTED_AUTHOR_BONUS,
  VISIBLE_COMMENT_STATUSES,
} from "../src/features/comments/constants/comment";
import type { CommentStatus } from "../src/features/comments/types";

// ── clean comments pass ─────────────────────────────────────────────
const clean = moderateComment({
  body: "Great write-up. The part about invalidation finally made this click for me.",
  authorName: "Sara",
});
assert.equal(clean.status, "APPROVED");
assert.equal(clean.score, 0);
assert.deepEqual(clean.flags, []);

// A single link is tolerated.
const oneLink = moderateComment({
  body: "I wrote about this too, see https://example.com/post for the follow-up.",
  authorName: "Sara",
});
assert.equal(oneLink.status, "APPROVED");
assert.equal(oneLink.score, 0);

// ── links ───────────────────────────────────────────────────────────
const twoLinks = assessComment({
  body: "See https://a.example and https://b.example for details on this topic.",
  authorName: "Sara",
});
assert.ok(twoLinks.flags.includes("links"));
assert.ok(twoLinks.score >= REVIEW_SCORE_THRESHOLD);

const threeLinks = assessComment({
  body: "https://a.example https://b.example https://c.example — cheap backlinks here",
  authorName: "Sara",
});
assert.equal(decideStatus(threeLinks), "SPAM");
assert.ok(threeLinks.score >= SPAM_SCORE_THRESHOLD);
assert.equal(LINK_TOLERANCE, 1);

// ── promotional phrasing ────────────────────────────────────────────
const promo = moderateComment({
  body: "Buy now, this is the best deal on the internet for developers like you.",
  authorName: "Marketing",
});
assert.ok(promo.flags.includes("spam-phrases"));
assert.ok(promo.score >= REVIEW_SCORE_THRESHOLD);

// Word boundaries: "casino" inside "casinos" still matches; "backlinks" matches,
// but a word that merely contains a phrase as a substring must not.
assert.ok(assessComment({ body: "We visited a casino last week." }).flags.includes("spam-phrases"));
assert.ok(!assessComment({ body: "The casinoesque architecture was odd." }).flags.includes("spam-phrases"));

// ── shouting / repetition ───────────────────────────────────────────
const shout = assessComment({
  body: "THIS IS THE MOST IMPORTANT THING EVER WRITTEN ABOUT CACHING",
});
assert.ok(shout.flags.includes("shouting"));

const repeat = assessComment({ body: "yes!!!!!!!!! that is right" });
assert.ok(repeat.flags.includes("repetition"));

const wordRepeat = assessComment({
  body: "great great great great great article",
});
assert.ok(wordRepeat.flags.includes("repetition"));

// Short but normal sentences are not shouted.
assert.ok(!assessComment({ body: "OK" }).flags.includes("shouting"));

// ── author-name and body heuristics ─────────────────────────────────
const urlName = assessComment({
  body: "Interesting post, thanks for writing it up.",
  authorName: "cheap-www.spam.example",
});
assert.ok(urlName.flags.includes("url-in-name"));
assert.equal(decideStatus(urlName), "PENDING");

const emailBody = assessComment({
  body: "Contact me at someone@example.com to discuss a partnership.",
  authorName: "Sara",
});
assert.ok(emailBody.flags.includes("email-in-body"));

const short = assessComment({ body: "nice" });
assert.ok(short.flags.includes("too-short"));

// ── trust and accountability lower the score ────────────────────────
// Use a body whose score is high enough that the bonus does not hit the
// 0 floor, so the exact penalty is observable.
const base = {
  body: "https://a.example https://b.example https://c.example",
  authorName: "Sara",
};
const anonymous = assessComment(base);
const signedIn = assessComment({ ...base, authenticated: true });
const trusted = assessComment({ ...base, trusted: true });

assert.equal(anonymous.score - signedIn.score, AUTHENTICATED_BONUS);
assert.equal(anonymous.score - trusted.score, TRUSTED_AUTHOR_BONUS);

// Borderline comment: a trusted author is published, an anonymous one is held.
const borderline = {
  body: "See https://a.example and https://b.example for the source data.",
  authorName: "Sara",
};
assert.equal(
  decideStatus(assessComment({ ...borderline, trusted: true })),
  "APPROVED"
);
assert.equal(decideStatus(assessComment(borderline)), "PENDING");

// Scores are clamped to 0..100.
const maxed = assessComment({
  body: "BUY NOW!!!!!! https://a.example https://b.example https://c.example someone@example.com",
  authorName: "www.spam.example",
});
assert.ok(maxed.score <= 100);
assert.equal(maxed.score, 100);

const floored = assessComment({
  body: "Thanks, that was useful.",
  authorName: "Sara",
  authenticated: true,
  trusted: true,
});
assert.equal(floored.score, 0);

// ── reasons are human-readable and match the flags ──────────────────
const explained = assessComment({
  body: "https://a.example https://b.example https://c.example",
  authorName: "Sara",
});
assert.equal(explained.reasons.length, explained.flags.length);
for (const reason of explained.reasons) {
  assert.equal(typeof reason, "string");
  assert.ok(reason.length > 0);
  assert.ok(!reason.includes("_"), `reason should be prose: ${reason}`);
}

// ── transitions ─────────────────────────────────────────────────────
const statuses: CommentStatus[] = ["PENDING", "APPROVED", "REJECTED", "SPAM"];
for (const from of statuses) {
  for (const to of statuses) {
    assert.equal(canTransition(from, to), from !== to, `${from} -> ${to}`);
  }
}

// ── public visibility ───────────────────────────────────────────────
assert.deepEqual([...VISIBLE_COMMENT_STATUSES], ["APPROVED"]);
assert.ok(!(VISIBLE_COMMENT_STATUSES as readonly string[]).includes("PENDING"));

console.log("moderation verification passed");
console.log(
  `thresholds: review >= ${REVIEW_SCORE_THRESHOLD}, spam >= ${SPAM_SCORE_THRESHOLD}`
);
