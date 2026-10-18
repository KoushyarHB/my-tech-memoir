import {
  DEFAULT_DASHBOARD_RANGE,
  DASHBOARD_RANGE_CONFIG,
  isDashboardRange,
  type DashboardRange,
} from "../constants/dashboard";
import type {
  DashboardCommentsTrendPointDto,
  DashboardPostGrowthPointDto,
  GetDashboardDto,
  GetDashboardTrendsDto,
} from "../types";
import {
  bucketIndexFor,
  buildDashboardBuckets,
  dashboardRangeStart,
  describeBucket,
} from "./dashboard-buckets";
import {
  countComments,
  countPosts,
  countTags,
  findCommentTimestampsSince,
  findLatestPosts,
  findPostTimestampsSince,
  findRecentComments,
  sumPostViews,
} from "./dashboard-repository";

/**
 * Admin domain: dashboard read model.
 *
 * Every trend series is bucketed from the selected range, so the chart axis is
 * continuous and empty periods render as explicit zeroes instead of gaps.
 */

export function normalizeDashboardRange(value: unknown): DashboardRange {
  return isDashboardRange(value) ? value : DEFAULT_DASHBOARD_RANGE;
}

export async function getDashboardTrends(
  range: DashboardRange,
  now: Date = new Date()
): Promise<GetDashboardTrendsDto> {
  const buckets = buildDashboardBuckets(range, now);
  const since = dashboardRangeStart(buckets);
  const { bucket } = DASHBOARD_RANGE_CONFIG[range];

  const [posts, comments] = await Promise.all([
    findPostTimestampsSince(since),
    findCommentTimestampsSince(since),
  ]);

  const postGrowth: DashboardPostGrowthPointDto[] = buckets.map(
    (entry, index) => ({
      label: entry.label,
      key: entry.key,
      bucket: describeBucket(range, index, buckets),
      count: 0,
    })
  );

  for (const post of posts) {
    const index = bucketIndexFor(buckets, post.createdAt);
    if (index >= 0) postGrowth[index].count += 1;
  }

  const commentsTrend: DashboardCommentsTrendPointDto[] = buckets.map(
    (entry, index) => ({
      label: entry.label,
      key: entry.key,
      bucket: describeBucket(range, index, buckets),
      approved: 0,
      pending: 0,
      rejected: 0,
    })
  );

  for (const comment of comments) {
    const index = bucketIndexFor(buckets, comment.createdAt);
    if (index < 0) continue;

    const point = commentsTrend[index];
    if (comment.status === "APPROVED") point.approved += 1;
    else if (comment.status === "PENDING") point.pending += 1;
    else point.rejected += 1; // REJECTED | SPAM
  }

  return { range, bucket, postGrowth, commentsTrend };
}

export async function getAdminDashboardData(
  range: DashboardRange = DEFAULT_DASHBOARD_RANGE
): Promise<GetDashboardDto> {
  const [postCounts, tagCount, totalViews, commentCounts, latestPosts, recentComments, trends] =
    await Promise.all([
      countPosts(),
      countTags(),
      sumPostViews(),
      countComments(),
      findLatestPosts(),
      findRecentComments(),
      getDashboardTrends(range),
    ]);

  return {
    stats: {
      totalPosts: postCounts.total,
      publishedCount: postCounts.published,
      draftCount: postCounts.drafts,
      tagCount,
      totalViews,
      commentCount: commentCounts.total,
      pendingComments: commentCounts.pending,
    },
    range: trends.range,
    bucket: trends.bucket,
    postGrowth: trends.postGrowth,
    commentsTrend: trends.commentsTrend,
    latestPosts,
    recentComments,
  };
}
