"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
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
  preferencesEqual,
  readStoredPreferences,
  resolveThemePreference,
  systemPrefersDark,
} from "../lib/preferences";
import { readAppearanceCookie, writeAppearanceCookie } from "../lib/cookie";
import { fetchAppearance, saveAppearance } from "../services/appearance-service";

/**
 * Appearance domain: provider + hook.
 *
 * Owns every visual preference (theme, accent, reading scale, motion) and
 * reconciles three layers:
 *
 *   cookie       → what the pre-paint script already applied (fast, per device)
 *   localStorage → the anonymous / offline path
 *   database     → the account, shared across devices
 *
 * The database wins for signed-in users, except on a first sign-in where the
 * account has never stored anything — then the browser's existing preferences
 * are adopted rather than discarded.
 *
 * Server writes are triggered only by *user intent* (`update`/`reset`), never
 * by the persist effect. Otherwise signing in would re-run that effect and
 * could overwrite stored preferences with local defaults before the reconcile
 * request comes back.
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
  /** True once the account's stored preferences have been applied. */
  synced: boolean;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

/** Coalesces rapid changes (theme + accent in quick succession) into one write. */
const SERVER_SAVE_DEBOUNCE_MS = 600;

export function AppearanceProvider({ children }: { children: ReactNode }) {
  // Server render and the first client render both use defaults; the pre-paint
  // script has already put the real values on <html>.
  const [preferences, setPreferences] = useState<AppearancePreferences>(
    getDefaultPreferences
  );
  const [systemDark, setSystemDark] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [synced, setSynced] = useState(false);

  const { status } = useSession();
  const authenticated = status === "authenticated";

  /** Skips the persist effect when state was set from storage or the server. */
  const skipPersistRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Latest preferences, so callbacks never read stale state. */
  const latestRef = useRef(preferences);
  const authenticatedRef = useRef(false);

  const resolvedTheme = resolveThemePreference(preferences.theme, systemDark);

  useEffect(() => {
    authenticatedRef.current = authenticated;
  }, [authenticated]);

  // Read storage once on mount. The cookie is authoritative (it is written on
  // every change), with localStorage as the anonymous fallback.
  useEffect(() => {
    const stored = readAppearanceCookie() ?? readStoredPreferences();
    skipPersistRef.current = true;
    latestRef.current = stored;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(stored);
    setSystemDark(systemPrefersDark());
    setHydrated(true);
  }, []);

  // Apply + mirror locally. Never writes to the account — see the note above.
  useEffect(() => {
    latestRef.current = preferences;
    if (!hydrated) return;

    applyAppearance(preferences, resolvedTheme);

    if (skipPersistRef.current) {
      // Came from storage or the server; nothing to write back yet.
      skipPersistRef.current = false;
      return;
    }

    persistPreferences(preferences);
    writeAppearanceCookie(preferences);
  }, [hydrated, preferences, resolvedTheme]);

  /** Debounced account write, used only by `update` and `reset`. */
  const scheduleServerSave = useCallback((next: AppearancePreferences) => {
    if (!authenticatedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void saveAppearance(next).catch(() => {
        // Offline or signed out mid-flight: the cookie already holds the
        // value, so the next successful change will sync it.
      });
    }, SERVER_SAVE_DEBOUNCE_MS);
  }, []);

  // Flush a pending write when the tab goes away, so a quick close does not
  // lose the last change.
  useEffect(() => {
    const flush = () => {
      if (!saveTimerRef.current) return;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      void saveAppearance(latestRef.current).catch(() => {});
    };

    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  // Reconcile with the account once it is known.
  useEffect(() => {
    if (!hydrated || !authenticated) return;

    let cancelled = false;

    (async () => {
      try {
        const remote = await fetchAppearance();
        if (cancelled) return;

        if (remote === null) {
          // First sign-in on this account: keep what this browser already had.
          if (!isDefaultPreferences(latestRef.current)) {
            await saveAppearance(latestRef.current);
          }
        } else if (!preferencesEqual(remote, latestRef.current)) {
          skipPersistRef.current = true;
          latestRef.current = remote;
          setPreferences(remote);
          writeAppearanceCookie(remote);
        }
      } catch {
        // Keep local preferences if the request fails.
      } finally {
        if (!cancelled) setSynced(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, authenticated]);

  // Follow the OS while `system` is selected.
  useEffect(() => {
    if (preferences.theme !== "system" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preferences.theme]);

  const update = useCallback(
    (patch: AppearancePatch) => {
      const next = mergePreferences(latestRef.current, patch);
      latestRef.current = next;
      setPreferences(next);
      scheduleServerSave(next);
    },
    [scheduleServerSave]
  );

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
    const next = getDefaultPreferences();
    latestRef.current = next;
    setPreferences(next);
    scheduleServerSave(next);
  }, [scheduleServerSave]);

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
      synced,
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
      synced,
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
