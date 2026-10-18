"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { useCommentsPage } from "../hooks/use-comments";
import { COMMENT_PAGE_SIZE } from "../constants/comment";

type CommentSectionProps = {
  postId: string;
};

export function CommentSection({ postId }: CommentSectionProps) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error } = useCommentsPage(postId, {
    page,
    pageSize: COMMENT_PAGE_SIZE,
  });

  const comments = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalItems = data?.totalItems ?? 0;

  return (
    <section className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border-muted)" }}>
      <h2 className="mb-6 font-serif text-xl font-semibold text-ink-primary">
        Comments
        {totalItems > 0 ? (
          <span className="ml-2 text-sm font-normal tabular-nums text-ink-tertiary">
            ({totalItems})
          </span>
        ) : null}
      </h2>

      <CommentForm postId={postId} onCommentPosted={() => setPage(1)} />

      <div className="mt-8">
        <CommentList
          postId={postId}
          comments={comments}
          isPending={isPending}
          errorMessage={isError ? (error?.message ?? "Unknown error") : null}
        />
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Newer
          </Button>
          <span className="text-xs tabular-nums text-ink-tertiary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            Older
          </Button>
        </div>
      ) : null}
    </section>
  );
}
