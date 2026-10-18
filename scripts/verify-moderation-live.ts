/**
 * Live check of the moderation pipeline against the real database.
 * Read-only except for rows it creates and then removes.
 */
import { db } from "../src/lib/db";
import {
  createComment,
  getModerationPage,
  getModerationStats,
  moderateCommentById,
  bulkModerateComments,
  replyAsStaff,
  deleteCommentById,
  getCommentsPage,
} from "../src/features/comments/server/comment-service";
import { MODERATION_PAGE_SIZE } from "../src/features/comments/constants/comment";

async function main() {
  const post = await db.post.findFirst({ select: { id: true, slug: true } });
  if (!post) throw new Error("no post to test against");
  console.log(`post: ${post.slug}`);

  const marker = `verify-${Date.now()}`;

  // 1. A clean anonymous comment is auto-approved.
  const clean = await createComment(
    {
      postId: post.id,
      body: `Great article on caching. The ${marker} part was clear.`,
      authorName: "Verify Bot",
    },
    null
  );
  console.log(`clean      -> ${clean.status} (expected APPROVED)`);

  // 2. Obvious spam is hidden without review.
  const spam = await createComment(
    {
      postId: post.id,
      body: `BUY NOW!!!!!! https://a.example https://b.example https://c.example ${marker}`,
      authorName: "www.spam.example",
    },
    null
  );
  console.log(`spam       -> ${spam.status} (expected SPAM)`);

  // 3. Borderline link comment is queued.
  const pending = await createComment(
    {
      postId: post.id,
      body: `Sources: https://a.example and https://b.example ${marker}`,
      authorName: "Verify Bot",
    },
    null
  );
  console.log(`borderline -> ${pending.status} (expected PENDING)`);

  // 4. Pending is hidden from the public thread, approved is visible.
  const publicPage = await getCommentsPage(
    post.id,
    { page: 1, pageSize: 100 },
    { visibleOnly: true }
  );
  const publicIds = new Set(publicPage.items.map((item) => item.id));
  console.log(
    `public: clean=${publicIds.has(clean.id)} pending=${publicIds.has(pending.id)} spam=${publicIds.has(spam.id)} ` +
      `(expected true/false/false)`
  );
  if (!publicIds.has(clean.id)) throw new Error("approved comment missing from public thread");
  if (publicIds.has(pending.id)) throw new Error("pending comment leaked to public thread");
  if (publicIds.has(spam.id)) throw new Error("spam comment leaked to public thread");

  // 5. Approving the pending one publishes it.
  const approved = await moderateCommentById(pending.id, { status: "APPROVED" });
  console.log(`approve    -> ${approved.status}`);
  const afterApprove = await getCommentsPage(
    post.id,
    { page: 1, pageSize: 100 },
    { visibleOnly: true }
  );
  if (!afterApprove.items.some((item) => item.id === pending.id)) {
    throw new Error("approved comment still hidden");
  }

  // 6. No-op transitions are rejected.
  let rejectedNoop = false;
  try {
    await moderateCommentById(pending.id, { status: "APPROVED" });
  } catch {
    rejectedNoop = true;
  }
  if (!rejectedNoop) throw new Error("same-status transition should be rejected");
  console.log("no-op transition rejected");

  // 7. Bulk moderation is idempotent.
  const bulk = await bulkModerateComments([pending.id, spam.id], "REJECTED");
  const bulkAgain = await bulkModerateComments([pending.id, spam.id], "REJECTED");
  console.log(`bulk       -> updated ${bulk.updated}, again ${bulkAgain.updated} (expected 2, 0)`);
  if (bulk.updated !== 2 || bulkAgain.updated !== 0) {
    throw new Error("bulk moderation is not idempotent");
  }

  // 8. Staff reply is approved and attached to the root.
  const staffUser = await db.user.findFirst({
    where: { role: { in: ["ADMIN", "EDITOR"] } },
    select: { id: true },
  });
  if (staffUser) {
    const reply = await replyAsStaff(
      clean.id,
      { body: `Thanks for reading! ${marker}` },
      staffUser.id
    );
    console.log(`staff reply -> ${reply.status}, parent ${reply.parentId === clean.id ? "root" : "unexpected"}`);
    if (reply.status !== "APPROVED") throw new Error("staff reply should be approved");
    if (reply.parentId !== clean.id) throw new Error("staff reply should attach to the root");
  }

  // 9. The queue exposes post context + signals.
  const queue = await getModerationPage({
    page: 1,
    pageSize: MODERATION_PAGE_SIZE,
    search: marker,
  });
  console.log(`queue search -> ${queue.totalItems} rows`);
  for (const item of queue.items) {
    if (!item.post?.id) throw new Error("moderation row missing post context");
    if (typeof item.signals?.score !== "number") throw new Error("missing signals");
  }

  // 10. Stats add up.
  const stats = await getModerationStats();
  const sum = stats.pending + stats.approved + stats.rejected + stats.spam;
  console.log(`stats -> total ${stats.total}, by status ${sum}`);
  if (sum !== stats.total) throw new Error("status counts do not add up");

  // 11. Cleanup: deleting a root removes its replies (cascade).
  const repliesBefore = await db.comment.count({ where: { parentId: clean.id } });
  await deleteCommentById(clean.id);
  const repliesAfter = await db.comment.count({ where: { parentId: clean.id } });
  console.log(`cascade -> replies ${repliesBefore} -> ${repliesAfter}`);
  if (repliesAfter !== 0) throw new Error("replies were not cascaded");

  await db.comment.deleteMany({ where: { body: { contains: marker } } });

  const remaining = await db.comment.count({ where: { body: { contains: marker } } });
  if (remaining !== 0) throw new Error("cleanup failed");

  console.log("\nmoderation live check passed");
}

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("FAILED:", error);
    await db.$disconnect();
    process.exit(1);
  });
