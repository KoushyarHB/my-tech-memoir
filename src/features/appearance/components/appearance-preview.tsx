"use client";

import { Bookmark, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReadingWidth } from "../types";

const WIDTH_PREVIEW: Record<ReadingWidth, string> = {
  narrow: "72%",
  standard: "88%",
  wide: "100%",
};

type AppearancePreviewProps = {
  readingWidth: ReadingWidth;
};

/**
 * Live preview.
 *
 * Renders with the same tokens the real pages use (`text-primary` → accent,
 * `--reading-font-size`, `--reading-line-height`), so every control on the page
 * is reflected here immediately — including the theme, which changes the
 * surrounding surfaces through the design tokens.
 */
export function AppearancePreview({ readingWidth }: AppearancePreviewProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-(--bg-elevated)">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-ink-tertiary">
          Preview
        </h2>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-tertiary">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
          Live
        </span>
      </div>

      <div className="px-4 py-4">
        <div
          className="mx-auto"
          style={{ maxWidth: WIDTH_PREVIEW[readingWidth] }}
        >
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] font-normal">
              Systems
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-normal">
              Caching
            </Badge>
          </div>

          <h3 className="font-serif text-base leading-snug font-semibold text-ink-primary">
            The cost of a cache
          </h3>

          <p className="mt-1 text-[11px] text-ink-tertiary">
            Aug 16, 2026 · 6 min read
          </p>

          <p
            className="mt-2.5 text-ink-secondary"
            style={{
              fontSize: "var(--reading-font-size)",
              lineHeight: "var(--reading-line-height)",
            }}
          >
            Every cache is a promise you have to keep. The moment it stops being
            true, it quietly becomes a{" "}
            <span className="text-primary underline underline-offset-2">
              source of bugs
            </span>
            . Invalidation is the whole problem.
          </p>

          <pre
            className="mt-3 overflow-x-auto rounded-md border px-2.5 py-2 text-[11px]"
            style={{
              background: "var(--code-bg)",
              borderColor: "var(--code-border)",
              color: "var(--code-text)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <code>cache.set(key, value, ttl)</code>
          </pre>

          <div className="mt-3 flex items-center gap-1.5">
            <Button size="sm" className="h-7 text-[11px]">
              Read article
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Bookmark">
              <Bookmark className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Like">
              <Heart className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
