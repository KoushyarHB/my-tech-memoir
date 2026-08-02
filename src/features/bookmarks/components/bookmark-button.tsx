"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

type BookmarkButtonProps = {
  postId: string;
  initialBookmarked?: boolean;
};

export function BookmarkButton({
  postId,
  initialBookmarked = false,
}: BookmarkButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [justToggled, setJustToggled] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function checkBookmark() {
      try {
        const res = await fetch(`/api/bookmarks?postId=${postId}`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setBookmarked(json.data?.bookmarked ?? false);
        }
      } catch {
        // silently default to unbookmarked
      }
    }

    checkBookmark();
    return () => {
      cancelled = true;
    };
  }, [postId, status]);

  const handleToggle = useCallback(async () => {
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (res.ok) {
        const json = await res.json();
        setBookmarked(json.data?.bookmarked ?? false);
        setJustToggled(true);
        window.setTimeout(() => setJustToggled(false), 320);
      }
    } catch {
      // state reverts on next page load
    } finally {
      setLoading(false);
    }
  }, [postId, status, router]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
      aria-pressed={bookmarked}
      className={cn(
        "group relative flex size-10 shrink-0 items-center justify-center rounded-full",
        "border transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-focus) focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-60",
        bookmarked
          ? "border-accent bg-(--accent-subtle) text-accent shadow-sm"
          : "border-border bg-(--bg-elevated) text-ink-tertiary hover:border-(--border-hover) hover:text-ink-secondary hover:shadow-sm",
        justToggled && "animate-bookmark-pop"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300",
          "ring-2 ring-(--accent)/25",
          bookmarked ? "opacity-100" : "opacity-0 group-hover:opacity-60"
        )}
      />
      <Bookmark
        className={cn(
          "relative size-4 transition-transform duration-300 ease-out",
          "group-hover:-translate-y-0.5",
          bookmarked && "fill-current",
          justToggled && "scale-110"
        )}
      />
    </button>
  );
}
