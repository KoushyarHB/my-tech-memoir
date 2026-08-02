"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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

type SortKey =
  | "title"
  | "status"
  | "date"
  | "views"
  | "comments";

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

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3.5 opacity-50" />;
  return dir === "asc" ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 text-left font-medium transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground"
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

  const sortedPosts = useMemo(() => {
    const next = [...posts];
    next.sort((a, b) => {
      const result = comparePosts(a, b, sortKey);
      return sortDir === "asc" ? result : -result;
    });
    return next;
  }, [posts, sortKey, sortDir]);

  function exportMetadata() {
    const rows = sortedPosts.map((post) => ({
      Title: post.title,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">All Posts</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportMetadata}
          disabled={posts.length === 0}
        >
          <Download className="size-4" />
          Export metadata
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead
              label="Title"
              sortKey="title"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHead
              label="Status"
              sortKey="status"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
              className="w-[100px]"
            />
            <SortableHead
              label="Date"
              sortKey="date"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
              className="w-[130px]"
            />
            <SortableHead
              label="Views"
              sortKey="views"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
              className="w-[90px]"
            />
            <SortableHead
              label="Comments"
              sortKey="comments"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
              className="w-[110px]"
            />
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPosts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <Link
                  href={`/admin/${post.id}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {post.title}
                </Link>
                {post.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={post.published ? "default" : "outline"}>
                  {post.published ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(post.createdAt)}
              </TableCell>
              <TableCell className="text-sm tabular-nums text-muted-foreground">
                {post.viewCount.toLocaleString()}
              </TableCell>
              <TableCell className="text-sm tabular-nums text-muted-foreground">
                {post.commentCount.toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {post.published && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" })
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
                      buttonVariants({ variant: "ghost", size: "icon-sm" })
                    )}
                    title="Edit post"
                    aria-label="Edit post"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  <PostDeleteButton postId={post.id} postTitle={post.title} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
