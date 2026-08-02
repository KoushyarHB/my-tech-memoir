"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, Hash, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/features/blog/lib/slugify";
import { cn } from "@/lib/utils";

export type AdminTagRow = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  createdAt: string;
};

type AdminTagsManagerProps = {
  tags: AdminTagRow[];
};

export function AdminTagsManager({ tags }: AdminTagsManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [pending, setPending] = useState(false);

  const previewSlug = slugTouched ? slugify(slug) : slugify(name);

  const sortedTags = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name)),
    [tags]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a tag name");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          slug: previewSlug || undefined,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create tag");
      }

      toast.success(`Created “${trimmed}”`);
      setName("");
      setSlug("");
      setSlugTouched(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create tag"
      );
    } finally {
      setPending(false);
    }
  }

  return (
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

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-ink-primary">All tags</h2>
            <p className="mt-1 text-xs text-ink-tertiary">
              {sortedTags.length}{" "}
              {sortedTags.length === 1 ? "tag" : "tags"} available
            </p>
          </div>
        </div>

        {sortedTags.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <Hash className="mx-auto size-8 text-ink-tertiary/50" />
            <p className="mt-3 mb-1 font-serif text-xl text-ink-primary">
              No tags yet
            </p>
            <p className="text-sm text-ink-secondary">
              Create your first tag with the form.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedTags.map((tag) => (
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
      </section>
    </div>
  );
}
