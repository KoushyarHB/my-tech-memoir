import assert from "node:assert/strict";
import {
  getDefaultPreferences,
  isDefaultPreferences,
  mergePreferences,
  parsePreferences,
  resolveThemePreference,
} from "../src/features/appearance/lib/preferences";
import {
  ACCENT_OPTIONS,
  APPEARANCE_STORAGE_KEY,
  APPEARANCE_VERSION,
  DEFAULT_APPEARANCE,
  LEGACY_THEME_STORAGE_KEY,
  READING_SIZE_OPTIONS,
  READING_WIDTH_OPTIONS,
  THEME_OPTIONS,
} from "../src/features/appearance/constants/appearance";
import { APPEARANCE_SCRIPT } from "../src/features/appearance/lib/appearance-script";

// ── parsing / defaults ──────────────────────────────────────────────
const defaults = getDefaultPreferences();
assert.deepEqual(defaults, {
  version: APPEARANCE_VERSION,
  theme: "dark",
  accent: "default",
  readingSize: "md",
  readingWidth: "standard",
  reduceMotion: false,
});
assert.ok(isDefaultPreferences(defaults));

// Junk, nulls and partial objects all fall back safely.
assert.deepEqual(parsePreferences(null), defaults);
assert.deepEqual(parsePreferences("nope"), defaults);
assert.deepEqual(parsePreferences({}), defaults);
assert.deepEqual(parsePreferences({ theme: "neon" }).theme, "dark");
assert.deepEqual(parsePreferences({ accent: "chartreuse" }).accent, "default");
assert.deepEqual(parsePreferences({ readingSize: "xl" }).readingSize, "md");
assert.deepEqual(parsePreferences({ readingWidth: "huge" }).readingWidth, "standard");

// Valid values survive, and reduceMotion only accepts literal true.
const valid = parsePreferences({
  theme: "system",
  accent: "violet",
  readingSize: "lg",
  readingWidth: "wide",
  reduceMotion: true,
});
assert.equal(valid.theme, "system");
assert.equal(valid.accent, "violet");
assert.equal(valid.readingSize, "lg");
assert.equal(valid.readingWidth, "wide");
assert.equal(valid.reduceMotion, true);
assert.equal(parsePreferences({ reduceMotion: "true" }).reduceMotion, false);

// ── merging ─────────────────────────────────────────────────────────
const merged = mergePreferences(defaults, { accent: "rose" });
assert.equal(merged.accent, "rose");
assert.equal(merged.theme, defaults.theme);
assert.equal(isDefaultPreferences(merged), false);

// An invalid patch value cannot corrupt the state.
assert.equal(mergePreferences(defaults, { accent: "nope" as never }).accent, "default");

// ── theme resolution ────────────────────────────────────────────────
assert.equal(resolveThemePreference("light", true), "light");
assert.equal(resolveThemePreference("dark", false), "dark");
assert.equal(resolveThemePreference("system", true), "dark");
assert.equal(resolveThemePreference("system", false), "light");

// ── pre-paint script ────────────────────────────────────────────────
type FakeDom = ReturnType<typeof makeDom>;

function makeDom() {
  const classes = new Set<string>();
  const dataset: Record<string, string> = {};
  const style: Record<string, string> = {};

  return {
    classes,
    dataset,
    style,
    document: {
      documentElement: {
        classList: {
          add: (value: string) => classes.add(value),
          remove: (value: string) => classes.delete(value),
          toggle: (value: string, on: boolean) =>
            on ? classes.add(value) : classes.delete(value),
        },
        dataset,
        style,
      },
    },
  };
}

function runScript(stored: Record<string, string>, prefersDark: boolean): FakeDom {
  const dom = makeDom();
  const localStorage = {
    getItem: (key: string) => (key in stored ? stored[key] : null),
  };
  const window = {
    matchMedia: () => ({ matches: prefersDark }),
  };

  // Syntax check + execution against the fake DOM.
  const fn = new Function(
    "document",
    "localStorage",
    "window",
    APPEARANCE_SCRIPT
  );
  fn(dom.document, localStorage, window);
  return dom;
}

// Nothing stored → shipped defaults (dark, no accent override).
const empty = runScript({}, true);
assert.equal(empty.classes.has("dark"), true);
assert.equal(empty.dataset.accent, "default");
assert.equal(empty.dataset.readingSize, "md");
assert.equal(empty.dataset.readingWidth, "standard");
assert.equal(empty.dataset.reduceMotion, "false");
assert.equal(empty.style.colorScheme, "dark");

// Stored light + violet → no dark class, accent applied pre-paint.
const light = runScript(
  {
    [APPEARANCE_STORAGE_KEY]: JSON.stringify({
      theme: "light",
      accent: "violet",
      readingSize: "lg",
      readingWidth: "narrow",
      reduceMotion: true,
    }),
  },
  true
);
assert.equal(light.classes.has("dark"), false);
assert.equal(light.dataset.accent, "violet");
assert.equal(light.dataset.readingSize, "lg");
assert.equal(light.dataset.readingWidth, "narrow");
assert.equal(light.dataset.reduceMotion, "true");
assert.equal(light.style.colorScheme, "light");

// System follows the OS.
assert.equal(runScript({ [APPEARANCE_STORAGE_KEY]: JSON.stringify({ theme: "system" }) }, true).classes.has("dark"), true);
assert.equal(runScript({ [APPEARANCE_STORAGE_KEY]: JSON.stringify({ theme: "system" }) }, false).classes.has("dark"), false);

// Legacy `theme` key is migrated.
assert.equal(runScript({ [LEGACY_THEME_STORAGE_KEY]: "light" }, true).classes.has("dark"), false);
assert.equal(runScript({ [LEGACY_THEME_STORAGE_KEY]: "dark" }, false).classes.has("dark"), true);

// Corrupt payload does not throw and falls back to defaults.
const corrupt = runScript({ [APPEARANCE_STORAGE_KEY]: "{not json" }, true);
assert.equal(corrupt.classes.has("dark"), true);
assert.equal(corrupt.dataset.accent, "default");

// ── catalog sanity ──────────────────────────────────────────────────
assert.equal(THEME_OPTIONS.length, 3);
assert.equal(ACCENT_OPTIONS.length, 6);
assert.equal(READING_SIZE_OPTIONS.length, 3);
assert.equal(READING_WIDTH_OPTIONS.length, 3);
assert.ok(DEFAULT_APPEARANCE.theme);
assert.ok(APPEARANCE_SCRIPT.includes("data"));
assert.ok(!APPEARANCE_SCRIPT.includes("</script"));

console.log("appearance preference + script verification passed");
