"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_OPTIONS } from "../constants/appearance";
import type { ThemePreference } from "../types";

/**
 * Theme picker.
 *
 * The swatches use literal colours rather than design tokens: each one previews
 * a theme that is *not* currently active, so it cannot use `var(--bg-*)`.
 */
const THEME_SWATCHES: Record<
  "light" | "dark",
  { shell: string; rail: string; line: string; accent: string }
> = {
  light: {
    shell: "#f2f1ed",
    rail: "#e3e2de",
    line: "#c9c6c0",
    accent: "#2563eb",
  },
  dark: {
    shell: "#1e1e1e",
    rail: "#161616",
    line: "#3a3a3a",
    accent: "#e8e8e8",
  },
};

function MockLines({ color }: { color: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-1 px-2">
      <span className="h-1 w-3/4 rounded-full" style={{ background: color }} />
      <span
        className="h-1 w-full rounded-full opacity-70"
        style={{ background: color }}
      />
      <span
        className="h-1 w-2/3 rounded-full opacity-50"
        style={{ background: color }}
      />
    </div>
  );
}

/** Fills its parent — the caller supplies the bordered frame. */
function ThemeMock({ variant }: { variant: "light" | "dark" }) {
  const swatch = THEME_SWATCHES[variant];

  return (
    <div
      className="flex h-full w-full"
      style={{ background: swatch.shell }}
      aria-hidden
    >
      <div
        className="flex w-1/4 flex-col gap-1 p-1.5"
        style={{ background: swatch.rail }}
      >
        <span
          className="h-1 w-full rounded-full"
          style={{ background: swatch.accent }}
        />
        <span
          className="h-1 w-2/3 rounded-full opacity-50"
          style={{ background: swatch.line }}
        />
        <span
          className="h-1 w-3/4 rounded-full opacity-50"
          style={{ background: swatch.line }}
        />
      </div>
      <MockLines color={swatch.line} />
    </div>
  );
}

function ThemeThumbnail({ theme }: { theme: ThemePreference }) {
  return (
    <div
      className="flex h-16 w-full overflow-hidden rounded-md border border-border"
      aria-hidden
    >
      {theme === "system" ? (
        <>
          <div className="w-1/2 border-r border-border">
            <ThemeMock variant="light" />
          </div>
          <div className="w-1/2">
            <ThemeMock variant="dark" />
          </div>
        </>
      ) : (
        <ThemeMock variant={theme} />
      )}
    </div>
  );
}

type ThemePickerProps = {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
};

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div role="group" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
      {THEME_OPTIONS.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "group flex flex-col gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
              selected
                ? "border-(--border-focus) bg-(--bg-muted)/60"
                : "border-border hover:border-(--border-hover) hover:bg-(--bg-muted)/40"
            )}
          >
            <ThemeThumbnail theme={option.value} />

            <span className="flex items-center justify-between gap-2">
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-xs font-medium",
                    selected ? "text-ink-primary" : "text-ink-secondary"
                  )}
                >
                  {option.label}
                </span>
                {option.description ? (
                  <span className="block text-[11px] text-ink-tertiary">
                    {option.description}
                  </span>
                ) : null}
              </span>
              {selected ? (
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-(--ink-primary) text-(--ink-inverse)">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
