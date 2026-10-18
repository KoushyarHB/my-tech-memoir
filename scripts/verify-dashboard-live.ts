/**
 * Live check: dashboard trends for every range against the real database.
 * Verifies the sum of bucketed points matches the raw row counts.
 */
import { getDashboardTrends } from "../src/features/admin/server/dashboard-service";
import { DASHBOARD_RANGES } from "../src/features/admin/constants/dashboard";
import { buildDashboardBuckets } from "../src/features/admin/server/dashboard-buckets";
import { db } from "../src/lib/db";

async function main() {
  const now = new Date();

  for (const range of DASHBOARD_RANGES) {
    const buckets = buildDashboardBuckets(range, now);
    const since = buckets[0].start;

    const trends = await getDashboardTrends(range, now);

    const postTotal = trends.postGrowth.reduce((sum, p) => sum + p.count, 0);
    const approved = trends.commentsTrend.reduce((s, p) => s + p.approved, 0);
    const pending = trends.commentsTrend.reduce((s, p) => s + p.pending, 0);
    const rejected = trends.commentsTrend.reduce((s, p) => s + p.rejected, 0);

    const expectedPosts = await db.post.count({
      where: { createdAt: { gte: since } },
    });
    const expectedComments = await db.comment.count({
      where: { createdAt: { gte: since } },
    });

    const ok =
      postTotal === expectedPosts &&
      approved + pending + rejected === expectedComments;

    console.log(
      `${range.padEnd(4)} points=${String(trends.postGrowth.length).padStart(2)} ` +
        `posts=${postTotal}/${expectedPosts} ` +
        `comments=${approved + pending + rejected}/${expectedComments} ` +
        `(a${approved} p${pending} r${rejected}) ` +
        `${ok ? "OK" : "MISMATCH"}`
    );

    if (!ok) throw new Error(`Mismatch for range ${range}`);
  }

  console.log("\ndashboard trends live check passed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("FAILED:", error);
    process.exit(1);
  });
