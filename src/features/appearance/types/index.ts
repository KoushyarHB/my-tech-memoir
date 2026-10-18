/** Appearance domain: preference shapes. */

export type ThemePreference = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

export type AccentPreference =
  | "default"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

export type ReadingSize = "sm" | "md" | "lg";

export type ReadingWidth = "narrow" | "standard" | "wide";

/**
 * The full appearance state.
 *
 * `version` guards against a stored payload from an older release: anything
 * unrecognised is discarded and defaults are used instead of throwing.
 */
export type AppearancePreferences = {
  version: number;
  theme: ThemePreference;
  accent: AccentPreference;
  readingSize: ReadingSize;
  readingWidth: ReadingWidth;
  reduceMotion: boolean;
};

export type AppearancePatch = Partial<Omit<AppearancePreferences, "version">>;
