import Link from "next/link";
import { getAllPosts } from "@/features/blog/server/post-service";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPostsView } from "@/features/admin/components/admin-posts-view";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await getAllPosts();
  const tagCount = await db.tag.count();

  const tablePosts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    published: post.published,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    viewCount: post.viewCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    readingTime: post.readingTime,
    tags: post.tags,
  }));

  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-tertiary">
            Content
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink-primary">
            Posts
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-secondary">
            Create, publish, and manage every entry in your memoir.
          </p>
        </div>
        <Link
          href="/admin/new"
          className={cn(buttonVariants({ variant: "default" }), "shrink-0")}
        >
          <Plus className="size-4" />
          New post
        </Link>
      </div>

      <AdminPostsView posts={tablePosts} tagCount={tagCount} />
    </div>
  );
}
