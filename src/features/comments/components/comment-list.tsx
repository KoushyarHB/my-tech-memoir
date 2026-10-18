"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentForm } from "./comment-form";
import type { GetCommentDto } from "../types";

type CommentListProps = {
  postId: string;
  comments: GetCommentDto[];
  isPending?: boolean;
  errorMessage?: string | null;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CommentItem({
  comment,
  postId,
}: {
  comment: GetCommentDto;
  postId: string;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const initial = comment.authorName.charAt(0).toUpperCase();

  return (
    <div>
      <div className="rounded-lg border border-border-muted bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-ink-secondary">
            {initial}
          </div>
          <span className="text-sm font-semibold text-ink-primary">
            {comment.authorName}
          </span>
          <span className="text-xs text-ink-tertiary">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
          {comment.body}
        </p>
        <div className="mt-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowReplyForm((v) => !v)}
          >
            {showReplyForm ? "Cancel" : "Reply"}
          </Button>
        </div>
      </div>

      {showReplyForm && (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          isReply
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 ml-6 space-y-3 border-l border-border-muted pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentList({
  postId,
  comments,
  isPending,
  errorMessage,
}: CommentListProps) {
  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border-muted bg-card p-4">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <p className="text-sm text-ink-tertiary">
        Could not load comments: {errorMessage}
      </p>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm italic text-ink-tertiary">
        No comments yet. Be the first to share your thoughts.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  );
}
