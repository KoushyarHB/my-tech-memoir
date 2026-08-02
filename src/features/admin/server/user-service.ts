import { db } from "@/lib/db";
import {
  ASSIGNABLE_ROLES,
  isUserRole,
  type UserRole,
} from "@/features/admin/types/roles";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  role: UserRole;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  providers: string[];
  postCount: number;
  bookmarkCount: number;
  commentCount: number;
  translationCount: number;
};

export { ASSIGNABLE_ROLES, ROLE_LABELS, isUserRole } from "@/features/admin/types/roles";
export type { UserRole } from "@/features/admin/types/roles";

const userSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  bio: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  accounts: {
    select: { provider: true },
  },
  _count: {
    select: {
      authoredPosts: true,
      bookmarks: true,
      comments: true,
      translations: true,
    },
  },
} as const;

function mapUser(user: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  role: UserRole;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  accounts: { provider: string }[];
  _count: {
    authoredPosts: number;
    bookmarks: number;
    comments: number;
    translations: number;
  };
}): AdminUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    bio: user.bio,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    providers: Array.from(new Set(user.accounts.map((a) => a.provider))),
    postCount: user._count.authoredPosts,
    bookmarkCount: user._count.bookmarks,
    commentCount: user._count.comments,
    translationCount: user._count.translations,
  };
}

export async function listUsers(): Promise<AdminUser[]> {
  const users = await db.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });

  return users.map(mapUser);
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
  actorId: string
): Promise<AdminUser> {
  if (!isUserRole(role)) {
    throw new Error("Invalid role");
  }

  if (userId === actorId && role !== "ADMIN") {
    throw new Error("You cannot demote your own admin account");
  }

  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!existing) {
    throw new Error("User not found");
  }

  if (existing.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("Cannot demote the last admin");
    }
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { role },
    select: userSelect,
  });

  return mapUser(user);
}
