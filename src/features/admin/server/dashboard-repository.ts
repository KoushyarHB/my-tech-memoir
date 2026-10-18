import { db } from "@/lib/db";
import { DASHBOARD_RECENT_LIMIT } from "../constants/dashboard";

/**
 * Admin domain: dashboard data access.
 *
 * Split out from the service so the dashboard follows the same
 * repository → service layering as the rest of the app.
 */

export async function countPosts(): Promise<{
  total: number;
  published: number;
  drafts: number;
}> {
  const [total, published] = await db.$transaction([
    db.post.count(),
    db.post.count({ where: { published: true } }),
  ]);
  return { total, published, drafts: total - published };
}

export async function countTags(): Promise<number> {
  return db.tag.count();
}

export async function sumPostViews(): Promise<number> {
  const aggregate = await db.post.aggregate({ _sum: { viewCount: true } });
  return aggregate._sum.viewCount ?? 0;
}

export async function countComments(): Promise<{
  total: number;
  pending: number;
}> {
  const [total, pending] = await db.$transaction([
    db.comment.count(),
    db.comment.count({ where: { status: "PENDING" } }),
  ]);
  return { total, pending };
}

export async function findLatestPosts() {
  return db.post.findMany({
    orderBy: { createdAt: "desc" },
    take: DASHBOARD_RECENT_LIMIT,
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      createdAt: true,
    },
  });
}

export async function findRecentComments() {
  return db.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: DASHBOARD_RECENT_LIMIT,
    select: {
      id: true,
      body: true,
      authorName: true,
      status: true,
      createdAt: true,
      user: { select: { name: true } },
      post: { select: { id: true, title: true, slug: true } },
    },
  });
}

/** Post timestamps since `since`, for the growth chart. */
export async function findPostTimestampsSince(
  since: Date
): Promise<{ createdAt: Date }[]> {
  return db.post.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
}

/** Comment timestamps + status since `since`, for the trend chart. */
export async function findCommentTimestampsSince(
  since: Date
): Promise<{ createdAt: Date; status: string }[]> {
  return db.comment.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, status: true },
  });
}
