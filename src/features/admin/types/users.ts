import type { UserRole } from "@/features/admin/types/roles";

export type AdminUserRow = {
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
