"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Eye,
  Pencil,
  Search,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type SortKey = "title" | "status" | "date" | "views" | "comments";
type SortDir = "asc" | "desc";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function comparePosts(a: AdminPostRow, b: AdminPostRow, key: SortKey): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    case "status":
      return Number(a.published) - Number(b.published);
    case "date":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "views":
      return a.viewCount - b.viewCount;
    case "comments":
      return a.commentCount - b.commentCount;
  }
}

function matchesQuery(post: AdminPostRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    post.title,
    post.slug,
    post.excerpt ?? "",
    post.published ? "published" : "draft",
    ...post.tags.map((tag) => tag.name),
    ...post.tags.map((tag) => tag.slug),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="size-3" />
  ) : (
    <ArrowDown className="size-3" />
  );
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;
  return (
    <TableHead className={cn("h-11 px-3", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex w-full items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors hover:text-ink-primary",
          align === "right" && "justify-end",
          active ? "text-ink-primary" : "text-ink-tertiary"
        )}
      >
        {label}
        <SortIcon active={active} dir={dir} />
      </button>
    </TableHead>
  );
}

type AdminPostsTableProps = {
  posts: AdminPostRow[];
};

export function AdminPostsTable({ posts }: AdminPostsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "title" ? "asc" : "desc");
  }

  const filteredPosts = useMemo(
    () => posts.filter((post) => matchesQuery(post, query)),
    [posts, query]
  );

  const sortedPosts = useMemo(() => {
    const next = [...filteredPosts];
    next.sort((a, b) => {
      const result = comparePosts(a, b, sortKey);
      return sortDir === "asc" ? result : -result;
    });
    return next;
  }, [filteredPosts, sortKey, sortDir]);

  function exportMetadata() {
    const rows = sortedPosts.map((post) => ({
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

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Posts");
    XLSX.writeFile(
      workbook,
      `post-metadata-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  const hasQuery = query.trim().length > 0;

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-ink-primary">All posts</h2>
            <p className="text-xs text-ink-tertiary">
              {hasQuery
                ? `${sortedPosts.length} of ${posts.length} matching`
                : `${posts.length} ${posts.length === 1 ? "entry" : "entries"}`}
              {" · "}sorted by {sortKey}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportMetadata}
            disabled={sortedPosts.length === 0}
            className="shrink-0"
          >
            <Download className="size-3.5" />
            Export metadata
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug, tags, status…"
            aria-label="Search posts"
            className="h-9 border-[var(--border)] bg-[var(--bg-base)] pl-8 text-sm dark:bg-[var(--bg-base)]"
          />
        </div>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-sm text-ink-primary">
            {hasQuery ? "No posts match your search" : "No posts yet"}
          </p>
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-2 text-xs text-ink-secondary underline-offset-2 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--border)] hover:bg-transparent">
              <SortableHead
                label="Title"
                sortKey="title"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="min-w-[220px]"
              />
              <SortableHead
                label="Status"
                sortKey="status"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="w-[120px]"
              />
              <SortableHead
                label="Date"
                sortKey="date"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="w-[120px]"
              />
              <SortableHead
                label="Views"
                sortKey="views"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="w-[88px]"
                align="right"
              />
              <SortableHead
                label="Comments"
                sortKey="comments"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="w-[100px]"
                align="right"
              />
              <TableHead className="h-11 w-[120px] px-3 text-right text-[11px] font-medium uppercase tracking-[0.1em] text-ink-tertiary">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPosts.map((post) => {
              const displayTitle = post.title.trim() || "Untitled draft";
              const tagPreview = post.tags.slice(0, 2);
              const extraTags = Math.max(0, post.tags.length - tagPreview.length);

              return (
                <TableRow
                  key={post.id}
                  className="border-[var(--border)] hover:bg-[var(--bg-muted)]/60"
                >
                  <TableCell className="max-w-[360px] whitespace-normal px-3 py-3.5">
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/admin/${post.id}`}
                        className="block truncate font-medium text-ink-primary transition-colors hover:text-[var(--accent)]"
                      >
                        {displayTitle}
                      </Link>
                      <p className="truncate font-mono text-[11px] text-ink-tertiary">
                        /{post.slug}
                      </p>
                      {tagPreview.length > 0 && (
                        <p className="truncate text-[11px] text-ink-tertiary">
                          {tagPreview.map((tag) => tag.name).join(" · ")}
                          {extraTags > 0 ? ` · +${extraTags}` : ""}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
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
                        aria-hidden
                      />
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3.5 text-sm text-ink-secondary">
                    {formatDate(post.createdAt)}
                  </TableCell>
                  <TableCell className="px-3 py-3.5 text-right text-sm tabular-nums text-ink-secondary">
                    {post.viewCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-3 py-3.5 text-right text-sm tabular-nums text-ink-secondary">
                    {post.commentCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <div className="flex items-center justify-end gap-0.5">
                      {post.published && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                            }),
                            "text-ink-tertiary hover:text-ink-primary"
                          )}
                          title="View published post"
                          aria-label="View published post"
                        >
                          <Eye className="size-3.5" />
                        </Link>
                      )}
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
                      <PostDeleteButton
                        postId={post.id}
                        postTitle={displayTitle}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
