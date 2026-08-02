"use client";

import { useEffect } from "react";

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

type ViewTrackerProps = {
  postId: string;
};

export function ViewTracker({ postId }: ViewTrackerProps) {
  useEffect(() => {
    const viewerKey = getOrCreateViewerKey();

    void fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, viewerKey }),
    }).catch(() => {
      // Ignore network / tracking failures
    });
  }, [postId]);

  return null;
}
