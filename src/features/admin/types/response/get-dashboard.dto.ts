import type { DashboardBucket, DashboardRange } from "../../constants/dashboard";

/** Admin domain: dashboard payload. */

export type DashboardStatsDto = {
  totalPosts: number;
  publishedCount: number;
  draftCount: number;
  tagCount: number;
  totalViews: number;
  commentCount: number;
  pendingComments: number;
};

export type DashboardPostGrowthPointDto = {
  label: string;
  /** Stable key for the bucket (used as the React key). */
  key: string;
  /** Long-form bucket description, shown in the tooltip. */
  bucket: string;
  count: number;
};

export type DashboardCommentsTrendPointDto = {
  label: string;
  key: string;
  bucket: string;
  approved: number;
  pending: number;
  rejected: number;
};

export type DashboardLatestPostDto = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: Date;
};

export type DashboardRecentCommentDto = {
  id: string;
  body: string;
  authorName: string | null;
  status: string;
  createdAt: Date;
  user: { name: string | null } | null;
  post: { id: string; title: string; slug: string };
};

export type GetDashboardDto = {
  stats: DashboardStatsDto;
  range: DashboardRange;
  bucket: DashboardBucket;
  postGrowth: DashboardPostGrowthPointDto[];
  commentsTrend: DashboardCommentsTrendPointDto[];
  latestPosts: DashboardLatestPostDto[];
  recentComments: DashboardRecentCommentDto[];
};

/** Response of the trends endpoint — the two charts for one range. */
export type GetDashboardTrendsDto = {
  range: DashboardRange;
  bucket: DashboardBucket;
  postGrowth: DashboardPostGrowthPointDto[];
  commentsTrend: DashboardCommentsTrendPointDto[];
};
