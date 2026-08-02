import { db } from "@/lib/db";
import { estimateReadingTime } from "@/features/blog/lib/reading-time";

export async function isBookmarked(
  userId: string,
  postId: string
): Promise<boolean> {
  const bookmark = await db.bookmark.findUnique({
    where: { postId_userId: { userId, postId } },
    select: { id: true },
  });
  return !!bookmark;
}

export async function toggleBookmark(
  userId: string,
  postId: string
): Promise<{ bookmarked: boolean; bookmarkId: string | null }> {
  const existing = await db.bookmark.findUnique({
    where: { postId_userId: { userId, postId } },
    select: { id: true },
  });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false, bookmarkId: null };
  }

  const bookmark = await db.bookmark.create({
    data: { userId, postId },
  });

  return { bookmarked: true, bookmarkId: bookmark.id };
}

export async function getBookmarksByUserId(userId: string) {
  const bookmarks = await db.bookmark.findMany({
    where: { userId },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          published: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return bookmarks.map((b) => ({
    id: b.id,
    postId: b.postId,
    userId: b.userId,
    createdAt: b.createdAt,
    post: {
      id: b.post.id,
      title: b.post.title,
      slug: b.post.slug,
      excerpt: b.post.excerpt,
      content: b.post.content,
      published: b.post.published,
      publishedAt: b.post.publishedAt,
      createdAt: b.post.createdAt,
      updatedAt: b.post.updatedAt,
      tags: b.post.tags.map((pt) => pt.tag),
      readingTime: estimateReadingTime(b.post.content),
    },
  }));
}
