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
  count: number;
};

export type DashboardCommentsTrendPointDto = {
  label: string;
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
  postGrowth: DashboardPostGrowthPointDto[];
  commentsTrend: DashboardCommentsTrendPointDto[];
  latestPosts: DashboardLatestPostDto[];
  recentComments: DashboardRecentCommentDto[];
};
