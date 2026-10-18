"use client";

import { useDataTableQuery } from "@/components/data-table";
import { useUserStats, useUsersPage } from "@/features/users/hooks/use-users";
import type { GetUserDto, GetUserStatsDto } from "@/features/users/types";
import { AdminMetrics } from "./admin-metrics";
import { AdminUsersTable } from "./admin-users-table";

type AdminUsersViewProps = {
  users: GetUserDto[];
  stats: GetUserStatsDto;
  currentUserId: string;
};

export function AdminUsersView({
  users: initialUsers,
  stats: initialStats,
  currentUserId,
}: AdminUsersViewProps) {
  const { query, update, setFilters, apiQuery } = useDataTableQuery();
  const { data: stats = initialStats } = useUserStats(initialStats);

  const isInitialQuery =
    query.page === 1 &&
    query.search.trim() === "" &&
    query.sorting.length === 0 &&
    query.columnFilters.length === 0;

  const { data, isFetching, isLoading, refetch } = useUsersPage(
    apiQuery,
    isInitialQuery
      ? {
          items: initialUsers,
          page: 1,
          pageSize: query.pageSize,
          totalItems: stats.total,
          totalPages:
            stats.total === 0 ? 0 : Math.ceil(stats.total / query.pageSize),
        }
      : undefined
  );

  const metrics = [
    { label: "Total users", value: stats.total },
    { label: "Admins", value: stats.admin },
    { label: "Writers", value: stats.editor },
    { label: "Readers", value: stats.user },
    { label: "Posts", value: stats.posts },
    { label: "Bookmarks", value: stats.bookmarks },
    { label: "Comments", value: stats.comments },
  ];

  return (
    <>
      <AdminMetrics metrics={metrics} className="sm:grid-cols-4 lg:grid-cols-7" />

      {stats.total === 0 && !isFetching ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="mb-1 font-serif text-xl text-ink-primary">No users yet</p>
          <p className="text-sm text-ink-secondary">
            Users appear here after they sign in for the first time.
          </p>
        </div>
      ) : (
        <AdminUsersTable
          users={data?.items ?? initialUsers}
          currentUserId={currentUserId}
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
