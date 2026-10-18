"use client";

import { useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Download, Eye, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableQuery,
} from "@/components/data-table";
import { cn } from "@/lib/utils";
import { PostDeleteButton } from "@/app/admin/post-delete-button";
import type { GetPostSummaryDto } from "@/features/blog/types";

export type AdminPostRow = GetPostSummaryDto;

type AdminPostsTableProps = {
  posts: AdminPostRow[];
  query: DataTableQuery;
  onQueryChange: (patch: Partial<DataTableQuery>) => void;
  onFiltersChange: (expression: string) => void;
  totalItems: number;
  totalPages: number;
  isFetching?: boolean;
  isLoading?: boolean;
  onReload?: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function exportRows(rows: AdminPostRow[]) {
  const exportData = rows.map((post) => ({
    Title: post.title || "(untitled)",
    Slug: post.slug,
    Status: post.published ? "Published" : "Draft",
    "Created At": formatDate(post.createdAt),
    "Published At": post.publishedAt ? formatDate(post.publishedAt) : "",
    "Updated At": formatDate(post.updatedAt),
    Views: post.viewCount,
    Comments: post.commentCount,
    "Reading Time": post.readingTime,
    Tags: post.tags.map((t) => t.name).join(", "),
    Excerpt: post.excerpt ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Posts");
  XLSX.writeFile(
    workbook,
    `post-metadata-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

export function AdminPostsTable({
  posts,
  query,
  onQueryChange,
  onFiltersChange,
  totalItems,
  totalPages,
  isFetching,
  isLoading,
  onReload,
}: AdminPostsTableProps) {
  const columns = useMemo<ColumnDef<AdminPostRow>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) =>
          [
            row.title,
            row.slug,
            row.excerpt ?? "",
            ...row.tags.map((tag) => tag.name),
            ...row.tags.map((tag) => tag.slug),
          ].join(" "),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        meta: {
          filterPlaceholder: "Search Title",
          filterField: "title",
          filterOperator: "contains",
        },
        cell: ({ row }) => {
          const post = row.original;
          const displayTitle = post.title.trim() || "Untitled draft";

          return (
            <div className="min-w-0 space-y-1.5 whitespace-normal pr-2">
              <Link
                href={`/admin/${post.id}`}
                className="line-clamp-2 font-medium leading-snug text-ink-primary transition-colors hover:text-accent"
              >
                {displayTitle}
              </Link>
              <p className="truncate font-mono text-[11px] leading-none text-ink-tertiary">
                /{post.slug}
              </p>
            </div>
          );
        },
        size: 320,
      },
      {
        id: "tags",
        accessorFn: (row) => row.tags.map((tag) => tag.name).join(", "),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tags" />
        ),
        // Tags are filtered server-side by id through the api-select filter.
        enableSorting: false,
        meta: {
          filterVariant: "api-select",
          filterEndpoint: "/api/tags",
          filterField: "tagId",
          filterOperator: "eq",
          filterPlaceholder: "All tags",
        },
        cell: ({ row }) => {
          const tags = row.original.tags;
          if (tags.length === 0) {
            return <span className="text-xs text-ink-tertiary">—</span>;
          }

          const preview = tags.slice(0, 2);
          const extra = tags.length - preview.length;

          return (
            <div className="flex flex-wrap items-center gap-1 whitespace-normal">
              {preview.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="max-w-full truncate text-[10px] font-normal"
                >
                  {tag.name}
                </Badge>
              ))}
              {extra > 0 ? (
                <span
                  className="text-[10px] text-ink-tertiary"
                  title={tags
                    .slice(preview.length)
                    .map((tag) => tag.name)
                    .join(", ")}
                >
                  +{extra}
                </span>
              ) : null}
            </div>
          );
        },
        size: 180,
      },
      {
        id: "status",
        accessorFn: (row) => (row.published ? "published" : "draft"),
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        meta: {
          filterVariant: "select",
          filterField: "published",
          filterOperator: "eq",
          filterOptions: [
            { label: "Published", value: "true" },
            { label: "Draft", value: "false" },
          ],
        },
        cell: ({ row }) => {
          const published = row.original.published;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                published ? "text-ink-primary" : "text-ink-tertiary"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  published ? "bg-emerald-500" : "bg-ink-tertiary/60"
                )}
                aria-hidden
              />
              {published ? "Published" : "Draft"}
            </span>
          );
        },
        size: 120,
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
          <span className="text-sm text-ink-secondary">
            {formatDate(row.original.createdAt)}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: "viewCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Views" />
        ),
        meta: {
          align: "center",
          filterPlaceholder: "Min views",
          filterField: "viewCount",
          filterOperator: "gte",
        },
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-ink-secondary">
            {row.original.viewCount.toLocaleString()}
          </span>
        ),
        size: 96,
      },
      {
        accessorKey: "commentCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Comments" />
        ),
        // Relation counts can be sorted but not filtered in Prisma.
        enableColumnFilter: false,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-ink-secondary">
            {row.original.commentCount.toLocaleString()}
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
          const post = row.original;
          const displayTitle = post.title.trim() || "Untitled draft";

          return (
            <div className="flex items-center gap-0.5">
              {post.published ? (
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "text-ink-tertiary hover:text-ink-primary"
                  )}
                  title="View published post"
                  aria-label="View published post"
                >
                  <Eye className="size-3.5" />
                </Link>
              ) : null}
              <Link
                href={`/admin/${post.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "text-ink-tertiary hover:text-ink-primary"
                )}
                title="Edit post"
                aria-label="Edit post"
              >
                <Pencil className="size-3.5" />
              </Link>
              <PostDeleteButton postId={post.id} postTitle={displayTitle} />
            </div>
          );
        },
        size: 120,
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={posts}
      getRowId={(row) => row.id}
      title="All posts"
      searchPlaceholder="Search title, slug, excerpt…"
      searchAriaLabel="Search posts"
      emptyMessage="No posts yet"
      emptyFilteredMessage="No posts match your filters"
      query={query}
      onQueryChange={onQueryChange}
      onFiltersChange={onFiltersChange}
      totalItems={totalItems}
      totalPages={totalPages}
      isFetching={isFetching}
      isLoading={isLoading}
      onReload={onReload}
      toolbar={({ rows }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exportRows(rows)}
          disabled={rows.length === 0}
          className="shrink-0"
        >
          <Download className="size-3.5" />
          Export metadata
        </Button>
      )}
    />
  );
}
