"use client";

import { useMemo, useState } from "react";
import { Check, ShieldX, Trash2, X } from "lucide-react";
import { AdminMetrics } from "@/features/admin/components";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDataTableQuery } from "@/components/data-table";
import { useRowSelection } from "@/components/data-table/use-row-selection";
import { cn } from "@/lib/utils";
import {
  COMMENT_STATUSES,
  COMMENT_STATUS_LABELS,
  MODERATION_PAGE_SIZE,
} from "../constants/comment";
import {
  useModerationPage,
  useModerationStats,
} from "../hooks/use-comments";
import { useModerationMutations } from "../hooks/use-comment-mutations";
import type {
  CommentStatus,
  GetCommentStatsDto,
  GetModerationCommentDto,
} from "../types";
import { AdminCommentsTable } from "./admin-comments-table";
import { CommentDetailDialog } from "./comment-detail-dialog";

type Tab = "ALL" | CommentStatus;

const TABS: Tab[] = ["ALL", ...COMMENT_STATUSES];

type AdminCommentsViewProps = {
  comments: GetModerationCommentDto[];
  stats: GetCommentStatsDto;
};

/**
 * Moderation workspace.
 *
 * The tab is part of the server query (not a client-side filter), so counts and
 * pages always agree. Column filters are layered on top by AND-ing the two
 * expressions, which keeps one code path for "status" and "author contains".
 */
export function AdminCommentsView({
  comments: initialComments,
  stats: initialStats,
}: AdminCommentsViewProps) {
  const [tab, setTab] = useState<Tab>("ALL");
  const [detail, setDetail] = useState<GetModerationCommentDto | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<GetModerationCommentDto | null>(null);

  const selection = useRowSelection();
  const { query, update, filters, setFilters, apiQuery } = useDataTableQuery({
    defaultPageSize: MODERATION_PAGE_SIZE,
  });

  const { data: stats = initialStats } = useModerationStats(initialStats);
  const { statusMutation, bulkMutation, deleteMutation } =
    useModerationMutations();

  const combinedFilters = useMemo(() => {
    const tabFilter = tab === "ALL" ? null : `status = "${tab}"`;
    return [tabFilter, filters].filter(Boolean).join(" AND ") || null;
  }, [tab, filters]);

  const isInitialQuery =
    tab === "ALL" &&
    query.page === 1 &&
    query.search.trim() === "" &&
    query.sorting.length === 0 &&
    query.columnFilters.length === 0 &&
    query.pageSize === MODERATION_PAGE_SIZE;

  const { data, isFetching, isLoading, refetch } = useModerationPage(
    { ...apiQuery, filters: combinedFilters },
    isInitialQuery
      ? {
          items: initialComments,
          page: 1,
          pageSize: MODERATION_PAGE_SIZE,
          totalItems: stats.total,
          totalPages:
            stats.total === 0
              ? 0
              : Math.ceil(stats.total / MODERATION_PAGE_SIZE),
        }
      : undefined
  );

  const comments = data?.items ?? initialComments;
  const selectedIds = selection.selectedIds;

  function selectTab(next: Tab) {
    setTab(next);
    update({ page: 1 });
    selection.clear();
  }

  function approve(comment: GetModerationCommentDto) {
    statusMutation.mutate({ id: comment.id, status: "APPROVED" });
  }

  function spam(comment: GetModerationCommentDto) {
    statusMutation.mutate({ id: comment.id, status: "SPAM" });
  }

  function bulk(status: CommentStatus) {
    if (selectedIds.length === 0) return;
    bulkMutation.mutate(
      { ids: selectedIds, status },
      { onSuccess: () => selection.clear() }
    );
  }

  const tabCounts: Record<Tab, number> = {
    ALL: stats.total,
    PENDING: stats.pending,
    APPROVED: stats.approved,
    REJECTED: stats.rejected,
    SPAM: stats.spam,
  };

  const metrics = [
    { label: "Total", value: stats.total },
    { label: "Pending", value: stats.pending },
    { label: "Approved", value: stats.approved },
    { label: "Rejected", value: stats.rejected },
    { label: "Spam", value: stats.spam },
    { label: "Last 24h", value: stats.lastDay },
  ];

  return (
    <>
      <AdminMetrics metrics={metrics} className="sm:grid-cols-3 lg:grid-cols-6" />

      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-border pb-0">
        {TABS.map((candidate) => {
          const active = candidate === tab;
          const count = tabCounts[candidate];

          return (
            <button
              key={candidate}
              type="button"
              onClick={() => selectTab(candidate)}
              aria-pressed={active}
              className={cn(
                "-mb-px inline-flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-medium transition-colors",
                active
                  ? "border-(--ink-primary) text-ink-primary"
                  : "border-transparent text-ink-tertiary hover:text-ink-secondary"
              )}
            >
              {candidate === "ALL" ? "All" : COMMENT_STATUS_LABELS[candidate]}
              <span
                className={cn(
                  "rounded-md px-1 py-0.5 text-[10px] tabular-nums",
                  active
                    ? "bg-(--bg-muted) text-ink-primary"
                    : "bg-(--bg-muted)/60 text-ink-tertiary"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {selectedIds.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-(--bg-muted)/50 px-3 py-2">
          <p className="text-xs text-ink-secondary">
            <span className="font-medium text-ink-primary">
              {selectedIds.length}
            </span>{" "}
            selected
          </p>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={bulkMutation.isPending}
              onClick={() => bulk("APPROVED")}
            >
              <Check className="size-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkMutation.isPending}
              onClick={() => bulk("REJECTED")}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkMutation.isPending}
              onClick={() => bulk("SPAM")}
              className="text-red-500 hover:text-red-600"
            >
              <ShieldX className="size-3.5" />
              Spam
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={selection.clear}
              aria-label="Clear selection"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      <AdminCommentsTable
        comments={comments}
        query={query}
        onQueryChange={update}
        onFiltersChange={setFilters}
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 0}
        isFetching={isFetching}
        isLoading={isLoading}
        onReload={() => void refetch()}
        selection={selection}
        onOpenComment={setDetail}
        onApprove={approve}
        onSpam={spam}
        onDelete={setDeleteTarget}
        pendingId={
          statusMutation.isPending ? statusMutation.variables?.id ?? null : null
        }
      />

      <CommentDetailDialog
        comment={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the comment
              {deleteTarget && deleteTarget.replyCount > 0
                ? ` and its ${deleteTarget.replyCount} ${
                    deleteTarget.replyCount === 1 ? "reply" : "replies"
                  }`
                : ""}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
            >
              <Trash2 className="size-3.5" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
