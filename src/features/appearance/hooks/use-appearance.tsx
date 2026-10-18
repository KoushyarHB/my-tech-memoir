"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AccentPreference,
  AppearancePatch,
  AppearancePreferences,
  ReadingSize,
  ReadingWidth,
  ResolvedTheme,
  ThemePreference,
} from "../types";
import {
  applyAppearance,
  getDefaultPreferences,
  isDefaultPreferences,
  mergePreferences,
  persistPreferences,
  readStoredPreferences,
  resolveThemePreference,
  systemPrefersDark,
} from "../lib/preferences";

/**
 * Appearance domain: provider + hook.
 *
 * Owns every visual preference (theme, accent, reading scale, motion) in one
 * place so there is a single source of truth. The first paint is handled by
 * `AppearanceScript`; this provider takes over on mount, persists changes, and
 * keeps `system` in sync with the OS.
 */

export type AppearanceContextValue = {
  preferences: AppearancePreferences;
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  accent: AccentPreference;
  readingSize: ReadingSize;
  readingWidth: ReadingWidth;
  reduceMotion: boolean;
  setTheme: (theme: ThemePreference) => void;
  setAccent: (accent: AccentPreference) => void;
  setReadingSize: (size: ReadingSize) => void;
  setReadingWidth: (width: ReadingWidth) => void;
  setReduceMotion: (enabled: boolean) => void;
  update: (patch: AppearancePatch) => void;
  toggleTheme: () => void;
  reset: () => void;
  isDefault: boolean;
  /** False during SSR and the first client render. */
  mounted: boolean;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  // Server render and the first client render both use defaults; the pre-paint
  // script has already put the real values on <html>.
  const [preferences, setPreferences] = useState<AppearancePreferences>(
    getDefaultPreferences
  );
  const [systemDark, setSystemDark] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const resolvedTheme = resolveThemePreference(preferences.theme, systemDark);

  // Read storage once on mount. This is an external-system read, not derived
  // state, so an effect is the correct place for it.
  useEffect(() => {
    const stored = readStoredPreferences();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(stored);
    setSystemDark(systemPrefersDark());
    setHydrated(true);
  }, []);

  // Apply + persist, but never before storage has been read: doing so would
  // briefly overwrite what the pre-paint script applied.
  useEffect(() => {
    if (!hydrated) return;
    applyAppearance(preferences, resolvedTheme);
    persistPreferences(preferences);
  }, [hydrated, preferences, resolvedTheme]);

  // Follow the OS while `system` is selected.
  useEffect(() => {
    if (preferences.theme !== "system" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preferences.theme]);

  const update = useCallback((patch: AppearancePatch) => {
    setPreferences((previous) => mergePreferences(previous, patch));
  }, []);

  const setTheme = useCallback(
    (theme: ThemePreference) => update({ theme }),
    [update]
  );
  const setAccent = useCallback(
    (accent: AccentPreference) => update({ accent }),
    [update]
  );
  const setReadingSize = useCallback(
    (readingSize: ReadingSize) => update({ readingSize }),
    [update]
  );
  const setReadingWidth = useCallback(
    (readingWidth: ReadingWidth) => update({ readingWidth }),
    [update]
  );
  const setReduceMotion = useCallback(
    (reduceMotion: boolean) => update({ reduceMotion }),
    [update]
  );

  const toggleTheme = useCallback(() => {
    const next: ThemePreference = resolvedTheme === "dark" ? "light" : "dark";
    update({ theme: next });
  }, [resolvedTheme, update]);

  const reset = useCallback(() => {
    setPreferences(getDefaultPreferences());
  }, []);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      preferences,
      theme: preferences.theme,
      resolvedTheme,
      accent: preferences.accent,
      readingSize: preferences.readingSize,
      readingWidth: preferences.readingWidth,
      reduceMotion: preferences.reduceMotion,
      setTheme,
      setAccent,
      setReadingSize,
      setReadingWidth,
      setReduceMotion,
      update,
      toggleTheme,
      reset,
      isDefault: isDefaultPreferences(preferences),
      mounted: hydrated,
    }),
    [
      preferences,
      resolvedTheme,
      setTheme,
      setAccent,
      setReadingSize,
      setReadingWidth,
      setReduceMotion,
      update,
      toggleTheme,
      reset,
      hydrated,
    ]
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }

  return context;
}
