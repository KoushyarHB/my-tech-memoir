export type AdminTagRow = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  createdAt: string;
};

export type CreateTagInput = {
  name: string;
  slug?: string;
};
