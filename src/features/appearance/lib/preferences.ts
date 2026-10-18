import {
  ACCENT_OPTIONS,
  APPEARANCE_STORAGE_KEY,
  APPEARANCE_VERSION,
  DEFAULT_APPEARANCE,
  LEGACY_THEME_STORAGE_KEY,
  READING_SIZE_OPTIONS,
  READING_WIDTH_OPTIONS,
  THEME_OPTIONS,
} from "../constants/appearance";
import type {
  AccentPreference,
  AppearancePatch,
  AppearancePreferences,
  ReadingSize,
  ReadingWidth,
  ResolvedTheme,
  ThemePreference,
} from "../types";

/**
 * Appearance domain: pure preference logic.
 *
 * Everything here is side-effect free except `readStoredPreferences` /
 * `persistPreferences` / `applyAppearance`, which are the three places that
 * touch browser globals. Keeping the validation separate means the stored
 * payload can never put the app into an unknown state.
 */

const THEME_VALUES = THEME_OPTIONS.map((option) => option.value);
const ACCENT_VALUES = ACCENT_OPTIONS.map((option) => option.value);
const SIZE_VALUES = READING_SIZE_OPTIONS.map((option) => option.value);
const WIDTH_VALUES = READING_WIDTH_OPTIONS.map((option) => option.value);

function pick<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function getDefaultPreferences(): AppearancePreferences {
  return { ...DEFAULT_APPEARANCE };
}

/** Coerces anything (parsed JSON, legacy value, corrupt entry) to a valid state. */
export function parsePreferences(raw: unknown): AppearancePreferences {
  if (!raw || typeof raw !== "object") {
    return getDefaultPreferences();
  }

  const value = raw as Record<string, unknown>;

  return {
    version: APPEARANCE_VERSION,
    theme: pick<ThemePreference>(
      value.theme,
      THEME_VALUES,
      DEFAULT_APPEARANCE.theme
    ),
    accent: pick<AccentPreference>(
      value.accent,
      ACCENT_VALUES,
      DEFAULT_APPEARANCE.accent
    ),
    readingSize: pick<ReadingSize>(
      value.readingSize,
      SIZE_VALUES,
      DEFAULT_APPEARANCE.readingSize
    ),
    readingWidth: pick<ReadingWidth>(
      value.readingWidth,
      WIDTH_VALUES,
      DEFAULT_APPEARANCE.readingWidth
    ),
    reduceMotion: value.reduceMotion === true,
  };
}

/** Applies a partial update, keeping every field valid. */
export function mergePreferences(
  current: AppearancePreferences,
  patch: AppearancePatch
): AppearancePreferences {
  return parsePreferences({ ...current, ...patch });
}

export function preferencesEqual(
  a: AppearancePreferences,
  b: AppearancePreferences
): boolean {
  return (
    a.theme === b.theme &&
    a.accent === b.accent &&
    a.readingSize === b.readingSize &&
    a.readingWidth === b.readingWidth &&
    a.reduceMotion === b.reduceMotion
  );
}

/** True when the current state differs from the shipped defaults. */
export function isDefaultPreferences(
  preferences: AppearancePreferences
): boolean {
  return preferencesEqual(preferences, getDefaultPreferences());
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveThemePreference(
  theme: ThemePreference,
  prefersDark: boolean
): ResolvedTheme {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

// ── Browser storage ─────────────────────────────────────────────────

export function readStoredPreferences(): AppearancePreferences {
  if (typeof window === "undefined") return getDefaultPreferences();

  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (raw) {
      return parsePreferences(JSON.parse(raw));
    }

    // First run after the theme-only era: carry the choice over.
    const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (legacy) {
      return parsePreferences({ theme: legacy });
    }
  } catch {
    // Private mode / blocked storage — fall through to defaults.
  }

  return getDefaultPreferences();
}

export function persistPreferences(preferences: AppearancePreferences): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  } catch {
    // Storage full or unavailable: the in-memory state still applies.
  }
}

// ── DOM application ─────────────────────────────────────────────────

/**
 * Applies preferences to `<html>`.
 *
 * Only attributes are set — the actual colours and sizes live in
 * `globals.css`, so this function carries no design tokens and the pre-paint
 * script can do exactly the same thing.
 */
export function applyAppearance(
  preferences: AppearancePreferences,
  resolvedTheme: ResolvedTheme
): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.accent = preferences.accent;
  root.dataset.readingSize = preferences.readingSize;
  root.dataset.readingWidth = preferences.readingWidth;
  root.dataset.reduceMotion = preferences.reduceMotion ? "true" : "false";
  // Native widgets (scrollbars, form controls) follow the resolved theme.
  root.style.colorScheme = resolvedTheme;
}
