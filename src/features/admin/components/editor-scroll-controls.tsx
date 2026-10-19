"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Distance (px) from an edge before its control appears. */
const EDGE_THRESHOLD = 160;

type EditorScrollControlsProps = {
  /** The editor column. Its bottom edge is the "jump to bottom" target. */
  targetRef: React.RefObject<HTMLElement | null>;
  className?: string;
};

/** Matches the app's reduce-motion preference and the OS setting. */
function prefersReducedMotion(): boolean {
  return (
    document.documentElement.dataset.reduceMotion === "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Floating "back to top" / "jump to bottom" controls for the editor column.
 * Sticky (not fixed) so they stay inside the editor column at every width and
 * stop at the column's end instead of hovering over the meta sidebar.
 */
export function EditorScrollControls({
  targetRef,
  className,
}: EditorScrollControlsProps) {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const update = useCallback(() => {
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - viewportHeight;
    const target = targetRef.current;

    // Scroll position at which the editor's bottom edge meets the viewport's.
    const targetBottom = target
      ? target.getBoundingClientRect().bottom + scrollTop
      : document.documentElement.scrollHeight;
    const bottomScroll = Math.min(targetBottom - viewportHeight, maxScroll);

    setShowTop(scrollTop > EDGE_THRESHOLD);
    setShowBottom(bottomScroll - scrollTop > EDGE_THRESHOLD);
  }, [targetRef]);

  useEffect(() => {
    // Deferred one frame: reading layout then setting state synchronously in an
    // effect would cascade a render before paint.
    const frame = requestAnimationFrame(update);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // The editor grows as you type; keep the bottom threshold in sync.
    const target = targetRef.current;
    const observer = new ResizeObserver(update);
    if (target) observer.observe(target);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [targetRef, update]);

  function scrollTo(top: number) {
    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function jumpToBottom() {
    const target = targetRef.current;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    const targetBottom = target
      ? target.getBoundingClientRect().bottom + window.scrollY
      : document.documentElement.scrollHeight;

    scrollTo(Math.min(targetBottom - window.innerHeight, maxScroll));
  }

  if (!showTop && !showBottom) return null;

  return (
    <div
      className={cn(
        "pointer-events-none sticky bottom-4 z-20 mt-3 flex justify-end",
        className
      )}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-lg backdrop-blur-sm">
        {showTop && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={() => scrollTo(0)}
            title="Back to top"
            aria-label="Back to top"
          >
            <ArrowUpToLine className="size-4" />
          </Button>
        )}
        {showBottom && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={jumpToBottom}
            title="Jump to bottom"
            aria-label="Jump to bottom"
          >
            <ArrowDownToLine className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
