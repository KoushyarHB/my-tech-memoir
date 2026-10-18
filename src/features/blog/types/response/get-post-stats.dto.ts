/** Blog domain: aggregate counts for the admin tiles. */
export type GetPostStatsDto = {
  total: number;
  published: number;
  drafts: number;
  views: number;
  comments: number;
  tags: number;
};
