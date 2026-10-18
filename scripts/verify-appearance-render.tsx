import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppearanceProvider } from "../src/features/appearance/hooks";
import { AppearanceForm } from "../src/features/appearance/components";

/**
 * Renders the Appearance page body (provider + form) without a browser.
 * Catches wiring errors, missing sections, and empty option lists.
 */
const html = renderToStaticMarkup(
  React.createElement(
    AppearanceProvider,
    null,
    React.createElement(AppearanceForm)
  )
);

const required = [
  "Theme",
  "Accent colour",
  "Reading",
  "Accessibility",
  "Preview",
  "Reset to defaults",
  "Reduce motion",
  "Text size",
  "Content width",
];

for (const text of required) {
  if (!html.includes(text)) {
    throw new Error(`missing section/label: ${text}`);
  }
}

// Every option must render.
for (const label of ["Light", "Dark", "System", "Violet", "Emerald", "Amber", "Rose", "Slate", "Compact", "Comfortable", "Narrow", "Wide"]) {
  if (!html.includes(label)) {
    throw new Error(`missing option: ${label}`);
  }
}

// Defaults are active before hydration: Dark theme, Default accent,
// Default size and Standard width.
const pressed = html.match(/aria-pressed="true"/g)?.length ?? 0;
if (pressed !== 4) {
  throw new Error(`expected 4 pressed controls (theme, accent, size, width), got ${pressed}`);
}

// Reset is disabled while the state equals the defaults.
if (!html.includes("disabled")) {
  throw new Error("reset button should be disabled at defaults");
}

// The preview must reflect the live tokens, not hardcoded colours.
if (!html.includes("var(--reading-font-size)")) {
  throw new Error("preview does not use the reading font size variable");
}
if (!html.includes("var(--code-bg)")) {
  throw new Error("preview does not use the code tokens");
}
if (!html.includes("text-primary")) {
  throw new Error("preview does not use the accent-backed text token");
}

console.log("sections + options rendered  ✓");
console.log(`pressed controls: ${pressed} (theme, accent, size, width)  ✓`);
console.log("preview bound to design tokens  ✓");
console.log("appearance render verification passed");
