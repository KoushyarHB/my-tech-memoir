"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api-client";
import { useCommentMutations } from "../hooks/use-comment-mutations";

type CommentFormProps = {
  postId: string;
  parentId?: string | null;
  onCommentPosted?: () => void;
  onCancel?: () => void;
  isReply?: boolean;
};

export function CommentForm({
  postId,
  parentId = null,
  onCommentPosted,
  onCancel,
  isReply = false,
}: CommentFormProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const { createMutation } = useCommentMutations(postId);
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const submitting = createMutation.isPending;
  const error =
    validationError ??
    (createMutation.isError
      ? getErrorMessage(createMutation.error, "Something went wrong")
      : null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    createMutation.reset();

    const trimmed = body.trim();
    if (!trimmed) {
      setValidationError("Please write a comment.");
      return;
    }

    if (!isAuthenticated && !authorName.trim()) {
      setValidationError("Please enter your name.");
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        body: trimmed,
        authorName: authorName.trim() || undefined,
        authorEmail: authorEmail.trim() || undefined,
        parentId: parentId ?? undefined,
      });

      setBody("");
      setAuthorName("");
      setAuthorEmail("");
      onCommentPosted?.();
      if (isReply) onCancel?.();

      // Auto-moderation may hold a comment back instead of publishing it.
      if (created.status === "PENDING") {
        toast.info("Your comment is awaiting moderation", {
          description: "It will appear once it has been reviewed.",
        });
      } else if (created.status !== "APPROVED") {
        toast.error("Your comment was flagged and will not be published", {
          description: "If this is a mistake, reply by email instead.",
        });
      }
    } catch {
      // Error state is surfaced through `createMutation.error` above.
    }
  }

  return (
    <form onSubmit={handleSubmit} className={isReply ? "mt-3" : undefined}>
      {!isAuthenticated && (
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`name-${parentId ?? "root"}`} className="mb-1 block text-xs">
              Name *
            </Label>
            <Input
              id={`name-${parentId ?? "root"}`}
              type="text"
              required
              maxLength={100}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label htmlFor={`email-${parentId ?? "root"}`} className="mb-1 block text-xs">
              Email <span className="text-ink-tertiary">(optional)</span>
            </Label>
            <Input
              id={`email-${parentId ?? "root"}`}
              type="email"
              maxLength={254}
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
      )}

      <div className="mb-3">
        <Textarea
          required
          maxLength={2000}
          rows={isReply ? 3 : 4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isReply ? "Write a reply…" : "Share your thoughts…"}
        />
        <p className="mt-1 text-right text-xs text-ink-tertiary">
          {body.length}/2000
        </p>
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting} size={isReply ? "sm" : "default"}>
          {submitting ? "Posting…" : isReply ? "Reply" : "Post Comment"}
        </Button>
        {isReply && onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
