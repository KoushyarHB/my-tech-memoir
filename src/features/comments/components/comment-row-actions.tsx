"use client";

import { Check, ExternalLink, ShieldX, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CommentStatus, GetModerationCommentDto } from "../types";

type CommentRowActionsProps = {
  comment: GetModerationCommentDto;
  pending?: boolean;
  onApprove: () => void;
  onSpam: () => void;
  onDelete: () => void;
  className?: string;
};

/** Quick moderation actions, kept to the three decisions that matter. */
export function CommentRowActions({
  comment,
  pending,
  onApprove,
  onSpam,
  onDelete,
  className,
}: CommentRowActionsProps) {
  const isApproved = comment.status === "APPROVED";
  const isSpam = comment.status === "SPAM";

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending || isApproved}
        onClick={onApprove}
        aria-label="Approve comment"
        title={isApproved ? "Already approved" : "Approve"}
        className="text-ink-tertiary hover:text-emerald-500"
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending || isSpam}
        onClick={onSpam}
        aria-label="Mark as spam"
        title={isSpam ? "Already marked as spam" : "Mark as spam"}
        className="text-ink-tertiary hover:text-red-500"
      >
        <ShieldX className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        render={
          <Link
            href={`/blog/${comment.post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
        aria-label="Open post"
        title="Open post"
        className="text-ink-tertiary hover:text-ink-primary"
      >
        <ExternalLink className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        onClick={onDelete}
        aria-label="Delete comment"
        title="Delete comment"
        className="text-ink-tertiary hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

/** Statuses a row can be moved to, excluding its current one. */
export function nextStatuses(status: CommentStatus): CommentStatus[] {
  return (["APPROVED", "PENDING", "REJECTED", "SPAM"] as CommentStatus[]).filter(
    (candidate) => candidate !== status
  );
}
