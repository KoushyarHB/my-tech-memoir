import assert from "node:assert/strict";
import {
  APPEARANCE_COOKIE,
  decodeAppearanceCookie,
  encodeAppearanceCookie,
  toCookiePayload,
} from "../src/features/appearance/lib/cookie";
import {
  getDefaultPreferences,
  parsePreferences,
} from "../src/features/appearance/lib/preferences";
import { APPEARANCE_SCRIPT } from "../src/features/appearance/lib/appearance-script";
import { DEFAULT_APPEARANCE } from "../src/features/appearance/constants/appearance";

// ── round trip ──────────────────────────────────────────────────────
const prefs = parsePreferences({
  theme: "light",
  accent: "emerald",
  readingSize: "lg",
  readingWidth: "wide",
  reduceMotion: true,
});

const encoded = encodeAppearanceCookie(prefs);
const decoded = decodeAppearanceCookie(encoded);

assert.deepEqual(decoded, prefs);
console.log(`encoded: ${encoded}`);
console.log(`bytes: ${encoded.length}`);

// Short keys, not the full shape.
assert.ok(encoded.includes("%22t%22") || encoded.includes('"t"'));
assert.ok(!encoded.includes("readingSize"));

// A year-long cookie must stay well inside the 4KB header budget.
assert.ok(encoded.length < 200, `cookie too large: ${encoded.length}`);

// ── defaults ────────────────────────────────────────────────────────
const defaults = getDefaultPreferences();
assert.deepEqual(decodeAppearanceCookie(encodeAppearanceCookie(defaults)), defaults);

// ── hostile / corrupt input falls back to null, never throws ────────
assert.equal(decodeAppearanceCookie(null), null);
assert.equal(decodeAppearanceCookie(""), null);
assert.equal(decodeAppearanceCookie("not-json"), null);
assert.equal(decodeAppearanceCookie("%7Bbroken"), null);

// An empty object is valid JSON but carries nothing: defaults, not null.
assert.deepEqual(decodeAppearanceCookie(encodeURIComponent("{}")), defaults);

// Unknown values are clamped rather than rejected.
const clamped = decodeAppearanceCookie(
  encodeURIComponent(
    JSON.stringify({ v: 1, t: "neon", a: "chartreuse", s: "xl", w: "huge", m: "yes" })
  )
);
assert.equal(clamped?.theme, DEFAULT_APPEARANCE.theme);
assert.equal(clamped?.accent, DEFAULT_APPEARANCE.accent);
assert.equal(clamped?.readingSize, DEFAULT_APPEARANCE.readingSize);
assert.equal(clamped?.readingWidth, DEFAULT_APPEARANCE.readingWidth);
assert.equal(clamped?.reduceMotion, false);

// Payload shape is exactly what the script expects.
assert.deepEqual(Object.keys(toCookiePayload(defaults)).sort(), [
  "a",
  "m",
  "s",
  "t",
  "v",
  "w",
]);

// ── the pre-paint script ────────────────────────────────────────────
type FakeDom = ReturnType<typeof makeDom>;

function makeDom(cookie: string) {
  const classes = new Set<string>();
  const dataset: Record<string, string> = {};
  const style: Record<string, string> = {};

  return {
    classes,
    dataset,
    style,
    document: {
      cookie,
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

function runScript(input: {
  cookie?: string;
  local?: string;
  legacy?: string;
  prefersDark?: boolean;
}): FakeDom {
  const dom = makeDom(input.cookie ?? "");
  const localStorage = {
    getItem: (key: string) => {
      if (key === "mtm.appearance") return input.local ?? null;
      if (key === "theme") return input.legacy ?? null;
      return null;
    },
  };
  const window = { matchMedia: () => ({ matches: input.prefersDark ?? true }) };

  new Function("document", "localStorage", "window", APPEARANCE_SCRIPT)(
    dom.document,
    localStorage,
    window
  );
  return dom;
}

// 1. Cookie wins over localStorage.
const fromCookie = runScript({
  cookie: `${APPEARANCE_COOKIE}=${encodeAppearanceCookie(prefs)}`,
  local: JSON.stringify({ theme: "dark", accent: "rose" }),
});
assert.equal(fromCookie.classes.has("dark"), false);
assert.equal(fromCookie.dataset.accent, "emerald");
assert.equal(fromCookie.dataset.readingSize, "lg");
assert.equal(fromCookie.dataset.readingWidth, "wide");
assert.equal(fromCookie.dataset.reduceMotion, "true");
assert.equal(fromCookie.style.colorScheme, "light");

// 2. No cookie → localStorage.
const fromLocal = runScript({
  local: JSON.stringify({ theme: "dark", accent: "violet" }),
});
assert.equal(fromLocal.classes.has("dark"), true);
assert.equal(fromLocal.dataset.accent, "violet");

// 3. No cookie, no storage → legacy theme key.
const fromLegacy = runScript({ legacy: "light", prefersDark: true });
assert.equal(fromLegacy.classes.has("dark"), false);

// 4. Nothing at all → defaults.
const empty = runScript({ prefersDark: true });
assert.equal(empty.classes.has("dark"), true);
assert.equal(empty.dataset.accent, "default");
assert.equal(empty.dataset.readingSize, "md");

// 5. A corrupt cookie must not stop localStorage being used.
const corruptCookie = runScript({
  cookie: `${APPEARANCE_COOKIE}=%7Bnot-json`,
  local: JSON.stringify({ theme: "light", accent: "rose" }),
});
assert.equal(corruptCookie.classes.has("dark"), false);
assert.equal(corruptCookie.dataset.accent, "rose");

// 6. System theme resolves against the OS.
const systemDark = runScript({
  cookie: `${APPEARANCE_COOKIE}=${encodeAppearanceCookie(
    parsePreferences({ theme: "system" })
  )}`,
  prefersDark: true,
});
assert.equal(systemDark.classes.has("dark"), true);

const systemLight = runScript({
  cookie: `${APPEARANCE_COOKIE}=${encodeAppearanceCookie(
    parsePreferences({ theme: "system" })
  )}`,
  prefersDark: false,
});
assert.equal(systemLight.classes.has("dark"), false);

// The script must not contain a raw closing tag or reference the database.
assert.ok(!APPEARANCE_SCRIPT.includes("</script"));
assert.ok(!/fetch\(|prisma|api\/appearance/i.test(APPEARANCE_SCRIPT));

console.log("cookie round trip + script source order verification passed");
