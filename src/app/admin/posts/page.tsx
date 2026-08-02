import Link from "next/link";
import { getAllPosts } from "@/features/blog/server/post-service";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPostsTable } from "@/features/admin/components";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await getAllPosts();
  const tagCount = await db.tag.count();

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;
  const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.commentCount, 0);

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

  const metrics = [
    { label: "Posts", value: posts.length },
    { label: "Published", value: publishedCount },
    { label: "Drafts", value: draftCount },
    { label: "Views", value: totalViews },
    { label: "Comments", value: totalComments },
    { label: "Tags", value: tagCount },
  ];

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

      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-[var(--bg-elevated)] px-4 py-4 sm:px-5"
          >
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-tertiary">
              {metric.label}
            </dt>
            <dd className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink-primary">
              {metric.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
          <p className="mb-1 font-serif text-xl text-ink-primary">No posts yet</p>
          <p className="mb-6 text-sm text-ink-secondary">
            Start with a draft — you can publish when it&apos;s ready.
          </p>
          <Link
            href="/admin/new"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Plus className="size-4" />
            Create your first post
          </Link>
        </div>
      ) : (
        <AdminPostsTable posts={tablePosts} />
      )}
    </div>
  );
}
