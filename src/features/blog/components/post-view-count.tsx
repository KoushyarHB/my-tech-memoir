"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const viewerKey = getOrCreateViewerKey();

    void fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, viewerKey }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as {
          success?: boolean;
          data?: { viewCount?: number };
        };
        if (
          json.success &&
          typeof json.data?.viewCount === "number"
        ) {
          setCount(json.data.viewCount);
        }
      })
      .catch(() => {
        // Ignore network / tracking failures
      });
  }, [postId]);

  return (
    <span>
      {count.toLocaleString()} {count === 1 ? "view" : "views"}
    </span>
  );
}
