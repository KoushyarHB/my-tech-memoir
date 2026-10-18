/** Tags domain: response DTO returned by list/detail endpoints. */
export type GetTagDto = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  createdAt: string;
};

/** Compact shape embedded in post payloads. */
export type GetTagCompactDto = {
  id: string;
  name: string;
  slug: string;
};
