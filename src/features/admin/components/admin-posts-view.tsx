"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePosts } from "@/features/blog/hooks/use-posts";
import type { PostListItem } from "@/features/blog/types";
import { AdminMetrics } from "./admin-metrics";
import { AdminPostsTable } from "./admin-posts-table";

type AdminPostsViewProps = {
  posts: PostListItem[];
  tagCount: number;
};

export function AdminPostsView({
  posts: initialPosts,
  tagCount,
}: AdminPostsViewProps) {
  const { data: posts = initialPosts } = usePosts({
    drafts: true,
    initialData: initialPosts,
  });

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  const metrics = [
    { label: "Posts", value: posts.length },
    { label: "Published", value: publishedCount },
    { label: "Drafts", value: draftCount },
    {
      label: "Views",
      value: posts.reduce((sum, post) => sum + post.viewCount, 0),
    },
    {
      label: "Comments",
      value: posts.reduce((sum, post) => sum + post.commentCount, 0),
    },
    { label: "Tags", value: tagCount },
  ];

  return (
    <>
      <AdminMetrics metrics={metrics} className="sm:grid-cols-3 lg:grid-cols-6" />

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
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
        <AdminPostsTable posts={posts} />
      )}
    </>
  );
}
