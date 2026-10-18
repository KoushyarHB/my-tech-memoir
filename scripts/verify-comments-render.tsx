import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminCommentsView } from "../src/features/comments/components/admin-comments-view";
import type {
  GetCommentStatsDto,
  GetModerationCommentDto,
} from "../src/features/comments/types";

const stats: GetCommentStatsDto = {
  total: 4,
  pending: 1,
  approved: 2,
  rejected: 0,
  spam: 1,
  lastDay: 3,
};

function comment(
  overrides: Partial<GetModerationCommentDto>
): GetModerationCommentDto {
  return {
    id: "c1",
    body: "Great article, the part about invalidation was clear.",
    authorName: "Sara",
    authorEmail: null,
    userId: null,
    authorRole: null,
    parentId: null,
    status: "APPROVED",
    createdAt: "2026-10-18T10:00:00.000Z",
    post: { id: "p1", title: "The cost of a cache", slug: "the-cost-of-a-cache" },
    replyCount: 0,
    parent: null,
    signals: { score: 0, flags: [], reasons: [] },
    ...overrides,
  };
}

const comments: GetModerationCommentDto[] = [
  comment({ id: "c1" }),
  comment({
    id: "c2",
    status: "PENDING",
    authorName: "Verify Bot",
    body: "Sources: https://a.example and https://b.example",
    signals: { score: 25, flags: ["links"], reasons: ["Contains links"] },
    parentId: "c1",
    replyCount: 2,
  }),
  comment({
    id: "c3",
    status: "SPAM",
    authorName: "Marketing",
    body: "BUY NOW!!!!!! https://a.example https://b.example https://c.example",
    signals: {
      score: 100,
      flags: ["links", "spam-phrases", "shouting", "repetition"],
      reasons: [
        "Contains links",
        "Contains promotional phrasing",
        "Mostly uppercase",
        "Repeated characters or words",
      ],
    },
  }),
  comment({ id: "c4", status: "APPROVED", authorName: "Ali" }),
];

const html = renderToStaticMarkup(
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    React.createElement(AdminCommentsView, { comments, stats })
  )
);

// Tabs with counts.
for (const tab of ["All", "Pending", "Approved", "Rejected", "Spam"]) {
  if (!html.includes(tab)) throw new Error(`missing tab: ${tab}`);
}
if (!html.includes("Last 24h")) throw new Error("missing tile");

// Rows: author names, status badges, and the flag explanation.
for (const author of ["Sara", "Verify Bot", "Marketing", "Ali"]) {
  if (!html.includes(author)) throw new Error(`missing row: ${author}`);
}
if (!html.includes("Risk 25/100")) throw new Error("missing risk score for the held comment");
if (!html.includes("Risk 100/100")) throw new Error("missing risk score for spam");
if (!html.includes("Contains promotional phrasing")) {
  throw new Error("missing signal reason");
}

// Reply / thread context in the row.
if (!html.includes("responses")) throw new Error("missing reply count");
if (!html.includes("reply")) throw new Error("missing reply marker");

// Selection is off by default: no bulk bar. (`aria-selected` appears on the
// checkboxes, so match the bulk bar's own copy instead.)
if (html.includes(">selected<")) throw new Error("bulk bar should be hidden with no selection");
if (html.includes("Clear selection")) {
  throw new Error("clear-selection control should be hidden with no selection");
}

// Checkboxes are present (header + one per row).
const checkboxes = html.match(/data-slot="checkbox"/g)?.length ?? 0;
if (checkboxes !== comments.length + 1) {
  throw new Error(`expected ${comments.length + 1} checkboxes, got ${checkboxes}`);
}

// Table chrome.
if (!html.includes("Search body, author or email")) {
  throw new Error("missing search placeholder");
}
if (!html.includes("All comments") && !html.includes("Comments")) {
  throw new Error("missing table title");
}

console.log("tabs, tiles and rows rendered  ✓");
console.log("auto-moderation signals surfaced  ✓");
console.log(`checkboxes: ${checkboxes} (header + ${comments.length} rows)  ✓`);
console.log("comments view render verification passed");
