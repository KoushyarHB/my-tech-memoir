"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDataTableQuery } from "@/components/data-table";
import { usePostStats, usePostsPage } from "@/features/blog/hooks/use-posts";
import type { GetPostStatsDto, GetPostSummaryDto } from "@/features/blog/types";
import { AdminMetrics } from "./admin-metrics";
import { AdminPostsTable } from "./admin-posts-table";

type AdminPostsViewProps = {
  posts: GetPostSummaryDto[];
  stats: GetPostStatsDto;
};

export function AdminPostsView({
  posts: initialPosts,
  stats: initialStats,
}: AdminPostsViewProps) {
  const { query, update, setFilters, apiQuery } = useDataTableQuery();
  const { data: stats = initialStats } = usePostStats(initialStats);

  const isInitialQuery =
    query.page === 1 &&
    query.search.trim() === "" &&
    query.sorting.length === 0 &&
    query.columnFilters.length === 0;

  const {
    data,
    isFetching,
    isLoading,
    refetch,
  } = usePostsPage(apiQuery, {
    drafts: true,
    initialData: isInitialQuery
      ? {
          items: initialPosts,
          page: 1,
          pageSize: query.pageSize,
          totalItems: stats.total,
          totalPages:
            stats.total === 0 ? 0 : Math.ceil(stats.total / query.pageSize),
        }
      : undefined,
  });

  const metrics = [
    { label: "Posts", value: stats.total },
    { label: "Published", value: stats.published },
    { label: "Drafts", value: stats.drafts },
    { label: "Views", value: stats.views },
    { label: "Comments", value: stats.comments },
    { label: "Tags", value: stats.tags },
  ];

  return (
    <>
      <AdminMetrics metrics={metrics} className="sm:grid-cols-3 lg:grid-cols-6" />

      {stats.total === 0 && !isFetching ? (
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
        <AdminPostsTable
          posts={data?.items ?? initialPosts}
          query={query}
          onQueryChange={update}
          onFiltersChange={setFilters}
          totalItems={data?.totalItems ?? 0}
          totalPages={data?.totalPages ?? 0}
          isFetching={isFetching}
          isLoading={isLoading}
          onReload={() => void refetch()}
        />
      )}
    </>
  );
}
