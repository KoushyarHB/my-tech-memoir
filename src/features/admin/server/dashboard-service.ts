import { db } from "@/lib/db";

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function getAdminDashboardData() {
  const now = new Date();

  const sixMonthsAgo = startOfMonth(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
  );
  const fourteenDaysAgo = startOfDay(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13))
  );

  const [
    totalPosts,
    publishedCount,
    draftCount,
    tagCount,
    viewsAgg,
    commentCount,
    pendingComments,
    latestPosts,
    recentComments,
    postsForGrowth,
    commentsForTrend,
  ] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { published: true } }),
    db.post.count({ where: { published: false } }),
    db.tag.count(),
    db.post.aggregate({ _sum: { viewCount: true } }),
    db.comment.count(),
    db.comment.count({ where: { status: "PENDING" } }),
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        createdAt: true,
      },
    }),
    db.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        body: true,
        authorName: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.post.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    db.comment.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, status: true },
    }),
  ]);

  const monthFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  });

  const postGrowth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1)
    );
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const count = postsForGrowth.filter((p) => {
      const c = p.createdAt;
      return (
        c.getUTCFullYear() === d.getUTCFullYear() &&
        c.getUTCMonth() === d.getUTCMonth()
      );
    }).length;
    return { label: monthFmt.format(d), key, count };
  });

  const dayFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const commentsTrend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(
      Date.UTC(
        fourteenDaysAgo.getUTCFullYear(),
        fourteenDaysAgo.getUTCMonth(),
        fourteenDaysAgo.getUTCDate() + i
      )
    );
    const dayComments = commentsForTrend.filter((c) => {
      const t = c.createdAt;
      return (
        t.getUTCFullYear() === d.getUTCFullYear() &&
        t.getUTCMonth() === d.getUTCMonth() &&
        t.getUTCDate() === d.getUTCDate()
      );
    });
    return {
      label: dayFmt.format(d),
      approved: dayComments.filter((c) => c.status === "APPROVED").length,
      pending: dayComments.filter((c) => c.status === "PENDING").length,
      rejected: dayComments.filter(
        (c) => c.status === "REJECTED" || c.status === "SPAM"
      ).length,
    };
  });

  return {
    stats: {
      totalPosts,
      publishedCount,
      draftCount,
      tagCount,
      totalViews: viewsAgg._sum.viewCount ?? 0,
      commentCount,
      pendingComments,
    },
    postGrowth: postGrowth.map(({ label, count }) => ({ label, count })),
    commentsTrend,
    latestPosts,
    recentComments,
  };
}
