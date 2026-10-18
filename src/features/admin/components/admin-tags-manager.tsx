"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, Hash, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTablePagination, useDataTableQuery } from "@/components/data-table";
import { slugify } from "@/shared/lib/slugify";
import { cn } from "@/lib/utils";
import { useTagMutations, useTagStats, useTagsPage } from "@/features/tags/hooks/use-tags";
import { TAG_PAGE_SIZE } from "@/features/tags/constants/tag";
import type { GetTagDto, GetTagStatsDto } from "@/features/tags/types";
import { AdminMetrics } from "./admin-metrics";

type AdminTagsManagerProps = {
  tags: GetTagDto[];
  stats: GetTagStatsDto;
};

export function AdminTagsManager({
  tags: initialTags,
  stats: initialStats,
}: AdminTagsManagerProps) {
  const { query, update, apiQuery } = useDataTableQuery({
    defaultPageSize: TAG_PAGE_SIZE,
  });
  const { createMutation } = useTagMutations();
  const { data: stats = initialStats } = useTagStats(initialStats);

  const isInitialQuery =
    query.page === 1 &&
    query.search.trim() === "" &&
    query.pageSize === TAG_PAGE_SIZE;

  const { data, isFetching, isLoading, refetch } = useTagsPage(
    apiQuery,
    isInitialQuery
      ? {
          items: initialTags,
          page: 1,
          pageSize: query.pageSize,
          totalItems: stats.total,
          totalPages:
            stats.total === 0 ? 0 : Math.ceil(stats.total / query.pageSize),
        }
      : undefined
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");

  const pending = createMutation.isPending;
  const previewSlug = slugTouched ? slugify(slug) : slugify(name);
  const tags = data?.items ?? initialTags;

  const metrics = [
    { label: "Tags", value: stats.total },
    { label: "In use", value: stats.used },
    { label: "Unused", value: stats.total - stats.used },
    { label: "Assignments", value: stats.assignments },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a tag name");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: trimmed,
        slug: previewSlug || undefined,
      });

      setName("");
      setSlug("");
      setSlugTouched(false);
    } catch {
      // Error toast is handled by the mutation.
    }
  }

  function submitSearch() {
    update({ search: searchDraft.trim(), page: 1 });
  }

  return (
    <>
      <AdminMetrics metrics={metrics} className="sm:grid-cols-4" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-(--bg-elevated) p-5"
        >
          <div className="mb-4">
            <h2 className="text-sm font-medium text-ink-primary">Add tag</h2>
            <p className="mt-1 text-xs text-ink-tertiary">
              Names are unique. Slug is used in public tag URLs.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-name" className="mb-1.5 block text-xs">
                Name
              </Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Architecture"
                maxLength={60}
                disabled={pending}
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="tag-slug" className="mb-1.5 block text-xs">
                Slug
              </Label>
              <Input
                id="tag-slug"
                value={slugTouched ? slug : previewSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="architecture"
                disabled={pending}
                autoComplete="off"
                className="font-mono text-xs"
              />
              <p className="mt-1.5 text-[11px] text-ink-tertiary">
                /blog/tag/{previewSlug || "…"}
              </p>
            </div>

            <Button type="submit" disabled={pending || !name.trim()} className="w-full">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add tag
            </Button>
          </div>
        </form>

        <section className="overflow-hidden rounded-xl border border-border bg-(--bg-elevated)">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-3.5">
            <div>
              <h2 className="text-sm font-medium text-ink-primary">All tags</h2>
              <p className="mt-1 text-xs text-ink-tertiary">
                {stats.total} {stats.total === 1 ? "tag" : "tags"} available
              </p>
            </div>

            <div className="relative max-w-sm">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-tertiary"
                aria-hidden
              />
              <Input
                type="text"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitSearch();
                  }
                }}
                placeholder="Search tags…"
                aria-label="Search tags"
                className="h-8 border-border bg-transparent pr-8 pl-8 text-xs shadow-none outline-none placeholder:text-ink-tertiary/80 focus-visible:border-(--border-hover) focus-visible:ring-0 dark:border-(--border-hover) dark:bg-transparent"
              />
              {searchDraft.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    update({ search: "", page: 1 });
                  }}
                  className="absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-(--bg-muted) hover:text-ink-primary"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>

          {isLoading && tags.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-ink-tertiary">
              Loading…
            </p>
          ) : tags.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Hash className="mx-auto size-8 text-ink-tertiary/50" />
              <p className="mt-3 mb-1 font-serif text-xl text-ink-primary">
                No tags yet
              </p>
              <p className="text-sm text-ink-secondary">
                Create your first tag with the form.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border border-border bg-(--bg-elevated) p-4",
                    "transition-colors hover:border-(--border-hover)"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-ink-primary">{tag.name}</p>
                      <span className="shrink-0 rounded-md bg-(--bg-muted) px-1.5 py-0.5 text-[11px] tabular-nums text-ink-tertiary">
                        {tag.postCount}{" "}
                        {tag.postCount === 1 ? "post" : "posts"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-ink-tertiary">
                      {tag.slug}
                    </p>
                  </div>
                  <Link
                    href={`/blog/tag/${tag.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs text-ink-secondary transition-colors hover:text-ink-primary"
                  >
                    View on site
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <DataTablePagination
            page={query.page}
            pageSize={query.pageSize}
            totalItems={data?.totalItems ?? 0}
            totalPages={data?.totalPages ?? 0}
            onPageChange={(page) => update({ page })}
            onPageSizeChange={(pageSize) => update({ pageSize, page: 1 })}
            onReload={() => void refetch()}
            isFetching={isFetching}
          />
        </section>
      </div>
    </>
  );
}
