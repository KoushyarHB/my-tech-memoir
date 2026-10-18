"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableQuery,
} from "@/components/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { GetModerationCommentDto } from "../types";
import { CommentRowActions } from "./comment-row-actions";
import { CommentSignalsPanel } from "./comment-signals-panel";
import { CommentStatusBadge } from "./comment-status-badge";

type RowSelection = {
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  allSelected: (ids: string[]) => boolean;
  someSelected: (ids: string[]) => boolean;
  toggleMany: (ids: string[], on: boolean) => void;
};

type AdminCommentsTableProps = {
  comments: GetModerationCommentDto[];
  query: DataTableQuery;
  onQueryChange: (patch: Partial<DataTableQuery>) => void;
  onFiltersChange: (expression: string) => void;
  totalItems: number;
  totalPages: number;
  isFetching?: boolean;
  isLoading?: boolean;
  onReload?: () => void;
  selection: RowSelection;
  onOpenComment: (comment: GetModerationCommentDto) => void;
  onApprove: (comment: GetModerationCommentDto) => void;
  onSpam: (comment: GetModerationCommentDto) => void;
  onDelete: (comment: GetModerationCommentDto) => void;
  pendingId?: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminCommentsTable({
  comments,
  query,
  onQueryChange,
  onFiltersChange,
  totalItems,
  totalPages,
  isFetching,
  isLoading,
  onReload,
  selection,
  onOpenComment,
  onApprove,
  onSpam,
  onDelete,
  pendingId,
}: AdminCommentsTableProps) {
  const columns = useMemo<ColumnDef<GetModerationCommentDto>[]>(() => {
    const { isSelected, toggle, allSelected, someSelected, toggleMany } =
      selection;

    return [
      {
        id: "select",
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ table }) => {
          const ids = table.getRowModel().rows.map((row) => row.original.id);
          return (
            <Checkbox
              aria-label="Select all comments on this page"
              checked={allSelected(ids)}
              indeterminate={someSelected(ids)}
              onCheckedChange={(checked) => toggleMany(ids, checked)}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select comment by ${row.original.authorName}`}
            checked={isSelected(row.original.id)}
            onCheckedChange={() => toggle(row.original.id)}
          />
        ),
      },
      {
        id: "comment",
        accessorFn: (row) => `${row.authorName} ${row.body}`,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Comment" />
        ),
        meta: {
          filterPlaceholder: "Search author",
          filterField: "authorName",
          filterOperator: "contains",
        },
        cell: ({ row }) => {
          const comment = row.original;
          const staff =
            comment.authorRole === "ADMIN" || comment.authorRole === "EDITOR";

          return (
            <div className="min-w-0 space-y-1 whitespace-normal pr-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-ink-primary">
                  {comment.authorName}
                </span>
                {staff ? (
                  <span className="rounded bg-(--accent-subtle) px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink-secondary">
                    Staff
                  </span>
                ) : null}
                {comment.parentId ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-ink-tertiary">
                    <MessageSquare className="size-2.5" />
                    reply
                  </span>
                ) : null}
                {comment.replyCount > 0 ? (
                  <span className="text-[10px] text-ink-tertiary">
                    · {comment.replyCount}{" "}
                    {comment.replyCount === 1 ? "response" : "responses"}
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onOpenComment(comment)}
                className="block max-w-full text-left text-xs leading-relaxed text-ink-secondary underline-offset-2 hover:text-ink-primary hover:underline"
                title="Open comment"
              >
                <span className="line-clamp-2">{comment.body}</span>
              </button>

              {comment.signals.flags.length > 0 ? (
                <CommentSignalsPanel
                  signals={comment.signals}
                  className="pt-0.5"
                />
              ) : null}
            </div>
          );
        },
        size: 340,
      },
      {
        id: "post",
        accessorFn: (row) => row.post.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Post" />
        ),
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
          const post = row.original.post;
          return (
            <Link
              href={`/admin/${post.id}`}
              className="line-clamp-2 max-w-full text-xs text-ink-secondary underline-offset-2 transition-colors hover:text-ink-primary hover:underline"
            >
              {post.title.trim() || "Untitled"}
            </Link>
          );
        },
        size: 180,
      },
      {
        id: "status",
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        enableColumnFilter: false,
        cell: ({ row }) => <CommentStatusBadge status={row.original.status} />,
        size: 110,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        meta: {
          filterPlaceholder: "From YYYY-MM-DD",
          filterField: "createdAt",
          filterOperator: "gte",
        },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-ink-secondary">
            {formatDate(row.original.createdAt)}
          </span>
        ),
        size: 110,
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Actions" />
        ),
        cell: ({ row }) => {
          const comment = row.original;
          return (
            <CommentRowActions
              comment={comment}
              pending={pendingId === comment.id}
              onApprove={() => onApprove(comment)}
              onSpam={() => onSpam(comment)}
              onDelete={() => onDelete(comment)}
              className={cn("justify-end")}
            />
          );
        },
        size: 140,
      },
    ];
  }, [
    selection,
    onOpenComment,
    onApprove,
    onSpam,
    onDelete,
    pendingId,
  ]);

  return (
    <DataTable
      columns={columns}
      data={comments}
      getRowId={(row) => row.id}
      title="Comments"
      searchPlaceholder="Search body, author or email…"
      searchAriaLabel="Search comments"
      emptyMessage="No comments yet"
      emptyFilteredMessage="No comments match your filters"
      query={query}
      onQueryChange={onQueryChange}
      onFiltersChange={onFiltersChange}
      totalItems={totalItems}
      totalPages={totalPages}
      isFetching={isFetching}
      isLoading={isLoading}
      onReload={onReload}
    />
  );
}
