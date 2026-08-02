"use client";

import { useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Download, Eye, Pencil } from "lucide-react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { cn } from "@/lib/utils";
import { PostDeleteButton } from "@/app/admin/post-delete-button";

export type AdminPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  publishedAt: string | null;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  readingTime: string;
  tags: { id: string; name: string; slug: string }[];
};

type AdminPostsTableProps = {
  posts: AdminPostRow[];
};

const includesString: FilterFn<AdminPostRow> = (row, columnId, filterValue) => {
  const query = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!query) return true;
  const value = row.getValue(columnId);
  return String(value ?? "")
    .toLowerCase()
    .includes(query);
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

export function AdminPostsTable({ posts }: AdminPostsTableProps) {
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
        meta: { filterPlaceholder: "Search Title" },
        filterFn: includesString,
        cell: ({ row }) => {
          const post = row.original;
          const displayTitle = post.title.trim() || "Untitled draft";
          const tagPreview = post.tags.slice(0, 2);
          const extraTags = Math.max(0, post.tags.length - tagPreview.length);

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
              {tagPreview.length > 0 ? (
                <p className="truncate text-[11px] leading-none text-ink-tertiary/90">
                  {tagPreview.map((tag) => tag.name).join(" · ")}
                  {extraTags > 0 ? ` · +${extraTags}` : ""}
                </p>
              ) : null}
            </div>
          );
        },
        size: 320,
      },
      {
        id: "status",
        accessorFn: (row) => (row.published ? "published" : "draft"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        meta: {
          filterVariant: "select",
          filterOptions: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
          ],
        },
        filterFn: (row, _id, filterValue) => {
          const value = String(filterValue ?? "");
          if (!value) return true;
          return (row.original.published ? "published" : "draft") === value;
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
        meta: { filterPlaceholder: "Search Date" },
        filterFn: (row, _id, filterValue) => {
          const query = String(filterValue ?? "")
            .trim()
            .toLowerCase();
          if (!query) return true;
          return formatDate(row.original.createdAt)
            .toLowerCase()
            .includes(query);
        },
        sortingFn: (a, b) =>
          new Date(a.original.createdAt).getTime() -
          new Date(b.original.createdAt).getTime(),
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
        meta: { align: "right", filterPlaceholder: "Search Views" },
        filterFn: includesString,
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
        meta: { align: "right", filterPlaceholder: "Search Comments" },
        filterFn: includesString,
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
        meta: { align: "right" },
        cell: ({ row }) => {
          const post = row.original;
          const displayTitle = post.title.trim() || "Untitled draft";

          return (
            <div className="flex items-center justify-end gap-0.5">
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
      searchPlaceholder="Search title, slug, tags, status…"
      searchAriaLabel="Search posts"
      emptyMessage="No posts yet"
      emptyFilteredMessage="No posts match your filters"
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
