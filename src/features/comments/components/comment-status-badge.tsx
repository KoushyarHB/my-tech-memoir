import { cn } from "@/lib/utils";
import {
  COMMENT_STATUS_LABELS,
} from "../constants/comment";
import type { CommentStatus } from "../types";

const STATUS_STYLES: Record<CommentStatus, { dot: string; text: string }> = {
  PENDING: { dot: "bg-amber-500", text: "text-ink-primary" },
  APPROVED: { dot: "bg-emerald-500", text: "text-ink-primary" },
  REJECTED: { dot: "bg-ink-tertiary/60", text: "text-ink-tertiary" },
  SPAM: { dot: "bg-red-500", text: "text-ink-tertiary" },
};

type CommentStatusBadgeProps = {
  status: CommentStatus;
  className?: string;
};

/** Dot + label, matching the status treatment used elsewhere in admin. */
export function CommentStatusBadge({
  status,
  className,
}: CommentStatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        style.text,
        className
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
        aria-hidden
      />
      {COMMENT_STATUS_LABELS[status]}
    </span>
  );
}
