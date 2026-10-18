import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REVIEW_SCORE_THRESHOLD,
  SPAM_SCORE_THRESHOLD,
} from "../constants/comment";
import type { CommentSignals } from "../types";

type CommentSignalsProps = {
  signals: CommentSignals;
  className?: string;
};

/**
 * Explains the auto-moderator's decision.
 *
 * The score and the flags are shown together so a reviewer can judge a held
 * comment in a glance instead of guessing why it was stopped.
 */
export function CommentSignalsPanel({
  signals,
  className,
}: CommentSignalsProps) {
  if (signals.flags.length === 0) {
    return (
      <p
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] text-ink-tertiary",
          className
        )}
      >
        <ShieldCheck className="size-3.5 text-emerald-500" />
        No risk signals
      </p>
    );
  }

  const level =
    signals.score >= SPAM_SCORE_THRESHOLD
      ? "spam"
      : signals.score >= REVIEW_SCORE_THRESHOLD
        ? "review"
        : "low";

  return (
    <div className={cn("space-y-1", className)}>
      <p
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-medium",
          level === "spam"
            ? "text-red-500"
            : level === "review"
              ? "text-amber-500"
              : "text-ink-tertiary"
        )}
      >
        <AlertTriangle className="size-3.5" />
        Risk {signals.score}/100
      </p>
      <ul className="flex flex-wrap gap-1">
        {signals.reasons.map((reason) => (
          <li
            key={reason}
            className="rounded-md bg-(--bg-muted) px-1.5 py-0.5 text-[10px] text-ink-secondary"
          >
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
