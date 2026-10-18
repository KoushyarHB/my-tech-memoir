"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, MessageSquareReply, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { COMMENT_BODY_MAX_LENGTH, COMMENT_STATUSES } from "../constants/comment";
import { useModerationThread } from "../hooks/use-comments";
import { useModerationMutations } from "../hooks/use-comment-mutations";
import type { GetModerationCommentDto } from "../types";
import { CommentSignalsPanel } from "./comment-signals-panel";
import { CommentStatusBadge } from "./comment-status-badge";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

type CommentDetailDialogProps = {
  comment: GetModerationCommentDto | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * Full moderation view for a single comment.
 *
 * Everything a moderator needs in one place: the whole body (the table only
 * shows a preview), the post it belongs to, the quoted parent, the auto
 * moderator's reasoning, the reply thread, and the actions.
 */
export function CommentDetailDialog({
  comment,
  onOpenChange,
}: CommentDetailDialogProps) {
  const open = comment !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,46rem)] w-[min(100vw-2rem,42rem)] overflow-y-auto p-0">
        {comment ? (
          <CommentDetailBody comment={comment} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CommentDetailBody({
  comment,
  onOpenChange,
}: {
  comment: GetModerationCommentDto;
  onOpenChange: (open: boolean) => void;
}) {
  const { statusMutation, deleteMutation, replyMutation, updateBodyMutation } =
    useModerationMutations();
  const { data: thread, isPending: threadPending } = useModerationThread(
    comment.id
  );

  const [reply, setReply] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  const busy = statusMutation.isPending || deleteMutation.isPending;

  function changeStatus(status: (typeof COMMENT_STATUSES)[number]) {
    statusMutation.mutate({ id: comment.id, status });
  }

  function submitReply() {
    const body = reply.trim();
    if (!body) return;

    replyMutation.mutate(
      { id: comment.id, body },
      { onSuccess: () => setReply("") }
    );
  }

  function saveBody() {
    const body = draft.trim();
    if (!body || body === comment.body) {
      setEditing(false);
      return;
    }

    updateBodyMutation.mutate(
      { id: comment.id, input: { body } },
      { onSuccess: () => setEditing(false) }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(comment.id, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <>
      <DialogHeader className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle className="text-base">{comment.authorName}</DialogTitle>
          <CommentStatusBadge status={comment.status} />
          {comment.authorRole ? (
            <span className="rounded-md bg-(--bg-muted) px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-tertiary">
              {comment.authorRole}
            </span>
          ) : null}
        </div>
        <DialogDescription className="mt-1 text-xs text-ink-tertiary">
          {formatDateTime(comment.createdAt)}
          {comment.authorEmail ? ` · ${comment.authorEmail}` : null}
          {" · "}
          <Link
            href={`/admin/${comment.post.id}`}
            className="underline-offset-2 hover:text-ink-primary hover:underline"
          >
            {comment.post.title.trim() || "Untitled"}
          </Link>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 px-5 py-4">
        {comment.parent ? (
          <blockquote className="rounded-lg border border-border bg-(--bg-base) px-3 py-2 text-xs text-ink-secondary">
            <p className="mb-1 font-medium text-ink-tertiary">
              In reply to {comment.parent.authorName}
            </p>
            <p className="line-clamp-3 whitespace-pre-wrap">{comment.parent.body}</p>
          </blockquote>
        ) : null}

        {editing ? (
          <div>
            <Label htmlFor="comment-body" className="mb-1.5 block text-xs">
              Comment body
            </Label>
            <Textarea
              id="comment-body"
              rows={6}
              maxLength={COMMENT_BODY_MAX_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="text-sm"
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={saveBody}
                disabled={updateBodyMutation.isPending}
              >
                {updateBodyMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                Save changes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
              {comment.body}
            </p>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 text-ink-tertiary"
              onClick={() => {
                setDraft(comment.body);
                setEditing(true);
              }}
            >
              <Pencil className="size-3" />
              Edit body
            </Button>
          </div>
        )}

        <CommentSignalsPanel signals={comment.signals} />

        <div className="rounded-lg border border-border">
          <p className="border-b border-border px-3 py-2 text-xs font-medium text-ink-primary">
            Thread
            {comment.replyCount > 0 ? (
              <span className="ml-1.5 text-ink-tertiary">
                ({comment.replyCount})
              </span>
            ) : null}
          </p>

          <div className="space-y-2 px-3 py-2">
            {threadPending ? (
              <p className="text-xs text-ink-tertiary">Loading replies…</p>
            ) : thread && thread.length > 0 ? (
              thread.map((replyComment) => (
                <div
                  key={replyComment.id}
                  className="rounded-md bg-(--bg-base) px-2.5 py-2"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-ink-primary">
                      {replyComment.authorName}
                    </span>
                    <CommentStatusBadge status={replyComment.status} />
                    {replyComment.authorRole === "ADMIN" ||
                    replyComment.authorRole === "EDITOR" ? (
                      <span className="rounded bg-(--accent-subtle) px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink-secondary">
                        Staff
                      </span>
                    ) : null}
                    <span className="text-[10px] text-ink-tertiary">
                      {formatDateTime(replyComment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink-secondary">
                    {replyComment.body}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-tertiary">No replies yet.</p>
            )}
          </div>

          <div className="border-t border-border px-3 py-2">
            <Label htmlFor="staff-reply" className="mb-1.5 block text-xs">
              Reply as staff
            </Label>
            <Textarea
              id="staff-reply"
              rows={3}
              maxLength={COMMENT_BODY_MAX_LENGTH}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  submitReply();
                }
              }}
              placeholder="Write a reply… (⌘/Ctrl + Enter to post)"
              className="text-sm"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                onClick={submitReply}
                disabled={replyMutation.isPending || !reply.trim()}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MessageSquareReply className="size-3.5" />
                )}
                Post reply
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="sticky bottom-0 flex-wrap items-center gap-2 border-t border-border bg-(--bg-elevated) px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="mr-auto text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={busy}
        >
          Delete
        </Button>

        {COMMENT_STATUSES.filter((status) => status !== comment.status).map(
          (status) => (
            <Button
              key={status}
              size="sm"
              variant={status === "APPROVED" ? "default" : "outline"}
              disabled={busy}
              onClick={() => changeStatus(status)}
              className={cn(
                status === "SPAM" && "text-red-500 hover:text-red-600",
                status === "REJECTED" && "text-ink-tertiary"
              )}
            >
              {status === "APPROVED"
                ? "Approve"
                : status === "PENDING"
                  ? "Send to review"
                  : status === "REJECTED"
                    ? "Reject"
                    : "Spam"}
            </Button>
          )
        )}

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
        >
          <ExternalLink className="size-3.5" />
        </Button>
      </DialogFooter>
    </>
  );
}
