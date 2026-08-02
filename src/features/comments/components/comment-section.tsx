"use client";

import { useState } from "react";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

type CommentSectionProps = {
  postId: string;
};

export function CommentSection({ postId }: CommentSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  function bumpRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <section className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border-muted)" }}>
      <h2 className="mb-6 font-serif text-xl font-semibold text-ink-primary">
        Comments
      </h2>

      <CommentForm postId={postId} onCommentPosted={bumpRefresh} />

      <div className="mt-8">
        <CommentList
          postId={postId}
          refreshKey={refreshKey}
          onReplyPosted={bumpRefresh}
        />
      </div>
    </section>
  );
}
