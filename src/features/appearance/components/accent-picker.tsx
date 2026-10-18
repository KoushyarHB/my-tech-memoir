"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT_OPTIONS } from "../constants/appearance";
import type { AccentPreference } from "../types";

type AccentPickerProps = {
  value: AccentPreference;
  onChange: (accent: AccentPreference) => void;
};

/**
 * Accent picker.
 *
 * The `default` swatch is a two-tone chip because its actual colour depends on
 * the active theme (blue in light, near-white in dark).
 */
export function AccentPicker({ value, onChange }: AccentPickerProps) {
  return (
    <div role="group" aria-label="Accent colour" className="flex flex-wrap gap-2">
      {ACCENT_OPTIONS.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
              selected
                ? "border-(--border-focus) bg-(--bg-muted)/60 font-medium text-ink-primary"
                : "border-border text-ink-secondary hover:border-(--border-hover) hover:text-ink-primary"
            )}
          >
            <span
              aria-hidden
              className="size-3.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15"
              style={{
                background:
                  option.value === "default"
                    ? "linear-gradient(135deg, #2563eb 0 50%, #e8e8e8 50% 100%)"
                    : option.swatch,
              }}
            />
            {option.label}
            {selected ? (
              <Check className="size-3 shrink-0 text-ink-primary" strokeWidth={3} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
