import {
  APPEARANCE_VERSION,
  DEFAULT_APPEARANCE,
} from "../constants/appearance";
import { parsePreferences } from "./preferences";
import type {
  AccentPreference,
  AppearancePreferences,
  ReadingSize,
  ReadingWidth,
  ThemePreference,
} from "../types";

/**
 * Appearance domain: the cookie mirror.
 *
 * The pre-paint script runs in `<head>` and cannot query the database, so
 * server-stored preferences are mirrored into a cookie it can read
 * synchronously. This is what keeps a signed-in user's theme from flashing on
 * a cold load.
 *
 * Deliberately **not** `httpOnly`: the whole point is that client JS reads it.
 * It carries no secrets — only theme, accent, reading scale and motion.
 */

export const APPEARANCE_COOKIE = "mtm_appearance";

/** One year. Preferences are not security-sensitive, so a long life is fine. */
export const APPEARANCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Short keys keep the header small; the value is still JSON for robustness. */
type CookiePayload = {
  v: number;
  t: ThemePreference;
  a: AccentPreference;
  s: ReadingSize;
  w: ReadingWidth;
  m: boolean;
};

export function toCookiePayload(
  preferences: AppearancePreferences
): CookiePayload {
  return {
    v: APPEARANCE_VERSION,
    t: preferences.theme,
    a: preferences.accent,
    s: preferences.readingSize,
    w: preferences.readingWidth,
    m: preferences.reduceMotion,
  };
}

/**
 * Serialises preferences for `Set-Cookie` / `document.cookie`.
 *
 * `encodeURIComponent` keeps the JSON inside the cookie-octet range, so the
 * value survives every browser without custom escaping.
 */
export function encodeAppearanceCookie(
  preferences: AppearancePreferences
): string {
  return encodeURIComponent(JSON.stringify(toCookiePayload(preferences)));
}

/**
 * Parses a cookie value back into preferences.
 *
 * Returns `null` for anything unreadable so callers fall back to storage or
 * defaults instead of throwing. Values are re-validated, so a hand-edited
 * cookie cannot put the app into an unknown state.
 */
export function decodeAppearanceCookie(
  raw: string | null | undefined
): AppearancePreferences | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<CookiePayload>;

    return parsePreferences({
      version: APPEARANCE_VERSION,
      theme: parsed.t,
      accent: parsed.a,
      readingSize: parsed.s,
      readingWidth: parsed.w,
      reduceMotion: parsed.m,
    });
  } catch {
    return null;
  }
}

/** Builds the `Set-Cookie` attributes shared by the API route and the client. */
export function appearanceCookieOptions() {
  return {
    path: "/",
    maxAge: APPEARANCE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    // Readable by the pre-paint script by design.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  };
}

// ── Browser helpers ─────────────────────────────────────────────────

/** Reads the cookie from `document.cookie`. Safe to call during render guards. */
export function readAppearanceCookie(): AppearancePreferences | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${APPEARANCE_COOKIE}=([^;]*)`)
  );

  return match ? decodeAppearanceCookie(match[1]) : null;
}

/** Writes the cookie from the client, so the next cold load paints correctly. */
export function writeAppearanceCookie(
  preferences: AppearancePreferences
): void {
  if (typeof document === "undefined") return;

  const options = appearanceCookieOptions();
  const parts = [
    `${APPEARANCE_COOKIE}=${encodeAppearanceCookie(preferences)}`,
    `path=${options.path}`,
    `max-age=${options.maxAge}`,
    `samesite=${options.sameSite}`,
  ];
  if (options.secure) parts.push("secure");

  document.cookie = parts.join("; ");
}

export { DEFAULT_APPEARANCE };
