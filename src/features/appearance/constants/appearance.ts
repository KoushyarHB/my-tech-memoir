import type {
  AccentPreference,
  ReadingSize,
  ReadingWidth,
  ThemePreference,
} from "../types";

/**
 * Appearance domain: storage + option catalog.
 *
 * Preferences are per-browser (not per-account): they describe how *this
 * viewer* wants the site to look, so they live in `localStorage` and are
 * applied before first paint by `AppearanceScript`.
 */

/** Bumped whenever the stored shape changes; unknown versions fall back. */
export const APPEARANCE_VERSION = 1;

export const APPEARANCE_STORAGE_KEY = "mtm.appearance";
/** Pre-appearance key, read once to migrate an existing theme choice. */
export const LEGACY_THEME_STORAGE_KEY = "theme";

export const DEFAULT_APPEARANCE = {
  version: APPEARANCE_VERSION,
  theme: "dark",
  accent: "default",
  readingSize: "md",
  readingWidth: "standard",
  reduceMotion: false,
} as const;

type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export const THEME_OPTIONS: ReadonlyArray<Option<ThemePreference>> = [
  { value: "light", label: "Light", description: "Warm paper" },
  { value: "dark", label: "Dark", description: "Low light" },
  { value: "system", label: "System", description: "Match your OS" },
];

/**
 * Accent palettes. `swatch` is only used for the picker dot; the actual
 * light/dark values live in `globals.css` under `[data-accent="…"]` so the
 * pre-paint script never has to carry colour data.
 */
export const ACCENT_OPTIONS: ReadonlyArray<
  Option<AccentPreference> & { swatch: string }
> = [
  { value: "default", label: "Default", swatch: "#2563eb" },
  { value: "violet", label: "Violet", swatch: "#7c3aed" },
  { value: "emerald", label: "Emerald", swatch: "#059669" },
  { value: "amber", label: "Amber", swatch: "#d97706" },
  { value: "rose", label: "Rose", swatch: "#e11d48" },
  { value: "slate", label: "Slate", swatch: "#475569" },
];

export const READING_SIZE_OPTIONS: ReadonlyArray<Option<ReadingSize>> = [
  { value: "sm", label: "Compact" },
  { value: "md", label: "Default" },
  { value: "lg", label: "Comfortable" },
];

export const READING_WIDTH_OPTIONS: ReadonlyArray<Option<ReadingWidth>> = [
  { value: "narrow", label: "Narrow" },
  { value: "standard", label: "Standard" },
  { value: "wide", label: "Wide" },
];

/** Human-readable names for the current selection summary. */
export const READING_SIZE_LABELS: Record<ReadingSize, string> = {
  sm: "Compact",
  md: "Default",
  lg: "Comfortable",
};

export const READING_WIDTH_LABELS: Record<ReadingWidth, string> = {
  narrow: "Narrow",
  standard: "Standard",
  wide: "Wide",
};
