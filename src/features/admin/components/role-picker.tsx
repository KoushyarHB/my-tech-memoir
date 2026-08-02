"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  type UserRole,
} from "@/features/admin/types/roles";
import { cn } from "@/lib/utils";

const ROLE_DOT: Record<UserRole, string> = {
  USER: "bg-ink-tertiary/60",
  EDITOR: "bg-blue-500",
  ADMIN: "bg-amber-500",
};

type RolePickerProps = {
  value: UserRole;
  disabled?: boolean;
  onChange: (role: UserRole) => void;
};

export function RolePicker({ value, disabled, onChange }: RolePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex min-w-[7.5rem] items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-ink-primary transition-colors",
          "hover:border-[var(--border-hover)] hover:bg-[var(--bg-muted)]/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]/30",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span className="flex items-center gap-2">
          <span
            className={cn("size-1.5 shrink-0 rounded-full", ROLE_DOT[value])}
            aria-hidden
          />
          {ROLE_LABELS[value]}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-ink-tertiary transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Select role"
          className="absolute top-[calc(100%+6px)] right-0 z-50 min-w-[10rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1 shadow-[var(--shadow-lg)]"
        >
          {ASSIGNABLE_ROLES.map((role) => {
            const selected = role === value;

            return (
              <button
                key={role}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setOpen(false);
                  if (!selected) onChange(role);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  selected
                    ? "bg-[var(--bg-muted)] font-medium text-ink-primary"
                    : "text-ink-secondary hover:bg-[var(--bg-muted)]/70 hover:text-ink-primary"
                )}
              >
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", ROLE_DOT[role])}
                  aria-hidden
                />
                <span className="flex-1">{ROLE_LABELS[role]}</span>
                {selected ? (
                  <Check className="size-3.5 shrink-0 text-ink-tertiary" />
                ) : (
                  <span className="size-3.5 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
