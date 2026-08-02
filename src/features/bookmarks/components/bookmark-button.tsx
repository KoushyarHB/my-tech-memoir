"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

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
      }
    } catch {
      // state reverts on next page load
    } finally {
      setLoading(false);
    }
  }, [postId, status, router]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <Bookmark
        className={cn(
          "size-4 transition-all",
          bookmarked && "fill-current text-primary"
        )}
      />
    </Button>
  );
}
