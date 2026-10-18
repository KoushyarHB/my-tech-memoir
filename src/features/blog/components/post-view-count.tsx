"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { recordPostView } from "../services/view-service";

const STORAGE_KEY = "mtm_viewer_key";

function getOrCreateViewerKey(): string {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    sessionStorage.setItem(STORAGE_KEY, key);
    return key;
  } catch {
    return `fallback-${Date.now()}`;
  }
}

type PostViewCountProps = {
  postId: string;
  initialCount: number;
};

export function PostViewCount({ postId, initialCount }: PostViewCountProps) {
  const [count, setCount] = useState(initialCount);
  const { mutate: recordView } = useMutation({
    mutationFn: (viewerKey: string) => recordPostView(postId, viewerKey),
    onSuccess: (result) => {
      if (typeof result.viewCount === "number") {
        setCount(result.viewCount);
      }
    },
  });

  useEffect(() => {
    // Ignore network / tracking failures.
    recordView(getOrCreateViewerKey());
  }, [postId, recordView]);

  return (
    <span>
      {count.toLocaleString()} {count === 1 ? "view" : "views"}
    </span>
  );
}
