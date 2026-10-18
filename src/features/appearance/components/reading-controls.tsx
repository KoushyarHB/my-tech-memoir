"use client";

import { cn } from "@/lib/utils";
import {
  READING_SIZE_OPTIONS,
  READING_WIDTH_OPTIONS,
} from "../constants/appearance";
import type { ReadingSize, ReadingWidth } from "../types";

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div>
      <p className="mb-2 text-xs text-ink-secondary">{label}</p>
      <div
        role="group"
        aria-label={label}
        className="inline-flex flex-wrap rounded-lg border border-border bg-(--bg-base) p-0.5"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                selected
                  ? "bg-(--bg-elevated) text-ink-primary shadow-(--shadow-sm)"
                  : "text-ink-tertiary hover:text-ink-secondary"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Relative widths so the difference is visible inside the card. */
const WIDTH_PREVIEW: Record<ReadingWidth, string> = {
  narrow: "60%",
  standard: "80%",
  wide: "100%",
};

type ReadingControlsProps = {
  size: ReadingSize;
  width: ReadingWidth;
  onSizeChange: (size: ReadingSize) => void;
  onWidthChange: (width: ReadingWidth) => void;
};

export function ReadingControls({
  size,
  width,
  onSizeChange,
  onWidthChange,
}: ReadingControlsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented
          label="Text size"
          value={size}
          options={READING_SIZE_OPTIONS}
          onChange={onSizeChange}
        />
        <Segmented
          label="Content width"
          value={width}
          options={READING_WIDTH_OPTIONS}
          onChange={onWidthChange}
        />
      </div>

      <div className="rounded-lg border border-border bg-(--bg-base) px-4 py-3">
        <p
          className="mx-auto text-ink-secondary"
          style={{
            fontSize: "var(--reading-font-size)",
            lineHeight: "var(--reading-line-height)",
            maxWidth: WIDTH_PREVIEW[width],
          }}
        >
          A good page is read, not scanned. Line length and rhythm matter more
          than any single word.
        </p>
      </div>
    </div>
  );
}
