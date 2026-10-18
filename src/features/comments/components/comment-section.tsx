"use client";

import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

type CommentSectionProps = {
  postId: string;
};

export function CommentSection({ postId }: CommentSectionProps) {
  return (
    <section className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border-muted)" }}>
      <h2 className="mb-6 font-serif text-xl font-semibold text-ink-primary">
        Comments
      </h2>

      <CommentForm postId={postId} />

      <div className="mt-8">
        <CommentList postId={postId} />
      </div>
    </section>
  );
}
