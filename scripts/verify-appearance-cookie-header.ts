import assert from "node:assert/strict";
import { APPEARANCE_SCRIPT } from "../src/features/appearance/lib/appearance-script";
import {
  APPEARANCE_COOKIE,
  encodeAppearanceCookie,
} from "../src/features/appearance/lib/cookie";
import { parsePreferences } from "../src/features/appearance/lib/preferences";

/** Minimal DOM: enough for the bootstrap script. */
function run(cookie: string) {
  const classes = new Set<string>();
  const dataset: Record<string, string> = {};
  const style: Record<string, string> = {};

  const document = {
    cookie,
    documentElement: {
      classList: {
        add: (v: string) => classes.add(v),
        remove: (v: string) => classes.delete(v),
        toggle: (v: string, on: boolean) => (on ? classes.add(v) : classes.delete(v)),
      },
      dataset,
      style,
    },
  };

  const localStorage = { getItem: () => null };
  const window = { matchMedia: () => ({ matches: true }) };

  new Function("document", "localStorage", "window", APPEARANCE_SCRIPT)(
    document,
    localStorage,
    window
  );

  return { classes, dataset };
}

const value = encodeAppearanceCookie(
  parsePreferences({ theme: "light", accent: "amber", readingSize: "sm" })
);

// Real browsers join cookies with "; ".
const cases: Array<[string, string]> = [
  ["only cookie", `${APPEARANCE_COOKIE}=${value}`],
  ["cookie first", `${APPEARANCE_COOKIE}=${value}; other=1`],
  ["cookie last", `a=1; b=2; ${APPEARANCE_COOKIE}=${value}`],
  ["cookie middle", `a=1; ${APPEARANCE_COOKIE}=${value}; b=2`],
  ["no space after ;", `a=1;${APPEARANCE_COOKIE}=${value}`],
];

for (const [label, cookie] of cases) {
  const result = run(cookie);
  assert.equal(
    result.classes.has("dark"),
    false,
    `${label}: light theme should remove the dark class`
  );
  assert.equal(result.dataset.accent, "amber", `${label}: accent not applied`);
  assert.equal(result.dataset.readingSize, "sm", `${label}: size not applied`);
  console.log(`${label.padEnd(20)} parsed  ✓`);
}

// A cookie whose *name* merely ends with ours must not match.
const decoy = run(`not_${APPEARANCE_COOKIE}=${value}`);
assert.equal(decoy.dataset.accent, "default", "decoy cookie name matched");
console.log("decoy cookie name ignored  ✓");

console.log("cookie parsing across header positions passed");
