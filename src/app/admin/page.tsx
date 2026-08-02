import Link from "next/link";
import { getAdminDashboardData } from "@/features/admin/server/dashboard-service";
import { AdminPostGrowthChart } from "@/features/admin/components/admin-post-growth-chart";
import { AdminCommentsTrendChart } from "@/features/admin/components/admin-comments-trend-chart";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function previewText(body: string, max = 72) {
  const plain = body.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trimEnd()}…`;
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();
  const { stats } = data;

  const metrics = [
    { label: "Total posts", value: stats.totalPosts },
    { label: "Published", value: stats.publishedCount },
    { label: "Drafts", value: stats.draftCount },
    { label: "Views", value: stats.totalViews },
    { label: "Comments", value: stats.commentCount },
    { label: "Pending comments", value: stats.pendingComments },
    { label: "Tags", value: stats.tagCount },
  ];

  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-tertiary">
            Overview
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Snapshot of content, engagement, and recent activity.
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

      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4"
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

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="mb-4 text-sm font-medium text-ink-primary">
            Post growth
          </h2>
          <AdminPostGrowthChart data={data.postGrowth} />
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="mb-4 text-sm font-medium text-ink-primary">
            Comments trend
          </h2>
          <AdminCommentsTrendChart data={data.commentsTrend} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-sm font-medium text-ink-primary">Latest posts</h2>
            <Link
              href="/admin/posts"
              className="text-xs text-ink-secondary underline-offset-2 hover:text-ink-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {data.latestPosts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-tertiary">
              No posts yet
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {data.latestPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/admin/${post.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--bg-muted)]/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-primary">
                        {post.title.trim() || "Untitled draft"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-tertiary">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        post.published ? "text-ink-primary" : "text-ink-tertiary"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          post.published
                            ? "bg-emerald-500"
                            : "bg-ink-tertiary/60"
                        )}
                      />
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-sm font-medium text-ink-primary">
              Recent comments
            </h2>
            <Link
              href="/admin/comments"
              className="text-xs text-ink-secondary underline-offset-2 hover:text-ink-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentComments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-tertiary">
              No comments yet
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {data.recentComments.map((comment) => {
                const author =
                  comment.user?.name ||
                  comment.authorName ||
                  "Anonymous";
                return (
                  <li key={comment.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-primary">
                          {author}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-secondary">
                          &ldquo;{previewText(comment.body)}&rdquo;
                        </p>
                        <p className="mt-1 truncate text-xs text-ink-tertiary">
                          on {comment.post.title.trim() || "Untitled"} ·{" "}
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      <Link
                        href={`/admin/${comment.post.id}`}
                        className="shrink-0 text-xs font-medium text-ink-secondary underline-offset-2 hover:text-ink-primary hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
