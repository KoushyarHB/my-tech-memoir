import type { UserRole } from "../roles";

/** Users domain: response DTO for list and detail endpoints. */
export type GetUserDto = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  providers: string[];
  postCount: number;
  bookmarkCount: number;
  commentCount: number;
  translationCount: number;
};
