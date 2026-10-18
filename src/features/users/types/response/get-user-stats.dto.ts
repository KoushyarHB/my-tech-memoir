/** Users domain: aggregate counts for the admin tiles. */
export type GetUserStatsDto = {
  total: number;
  admin: number;
  editor: number;
  user: number;
  posts: number;
  bookmarks: number;
  comments: number;
};
