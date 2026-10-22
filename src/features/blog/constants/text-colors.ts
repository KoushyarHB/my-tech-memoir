/**
 * The editor's text-colour palette and the theme-aware resolution shared by
 * every renderer (admin editor canvas, published post, previews).
 *
 * Why this exists — the dark-mode bug this module fixes:
 *
 * A `textStyle` colour is stored inline on the span (`style="color: …"`), so
 * the value is frozen at write time. Two swatches are design tokens written
 * out as hex — "Ink" is the *light* `--ink-primary` (#2a2926) and "Gray" is
 * the light `--ink-tertiary` (#787570). A sentence styled "Ink" in light mode
 * therefore kept rgb(42 41 38) on the dark canvas (#121212 ≈ 1.3:1 contrast)
 * while the surrounding paragraph kept following `--ink-secondary`, which is
 * exactly what "styling part of a sentence breaks the sentence in dark mode"
 * looks like.
 *
 * Resolving the stored value back to its token at render time fixes both
 * themes with no content migration. The chromatic swatches stay literal on
 * purpose: they are accents that read fine on either background, and "Blue"
 * must keep meaning blue — the theme accent is near-white in dark mode.
 */

export type TextColorSwatch = {
  label: string;
  /** Palette hex, or null for "Default" (clears the mark). */
  value: string | null;
};

export const TEXT_COLOR_SWATCHES: readonly TextColorSwatch[] = [
  { label: "Default", value: null },
  { label: "Ink", value: "#2a2926" },
  { label: "Gray", value: "#787570" },
  { label: "Blue", value: "#2563eb" },
  { label: "Teal", value: "#0d9488" },
  { label: "Green", value: "#16a34a" },
  { label: "Amber", value: "#d97706" },
  { label: "Red", value: "#dc2626" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Pink", value: "#db2777" },
] as const;

/** Palette values that are design tokens in disguise, and what they mean. */
const THEME_TOKEN_BY_COLOR: Record<string, string> = {
  "#2a2926": "var(--ink-primary)",
  "#787570": "var(--ink-tertiary)",
};

/** The only non-hex values a `textStyle.color` may hold. */
export const THEME_TEXT_COLOR_TOKENS: readonly string[] = Object.values(
  THEME_TOKEN_BY_COLOR
);

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+\s*)?\)$/;

function rgbToHex(value: string): string | null {
  const match = RGB_COLOR.exec(value);
  if (!match) return null;
  const channels = match.slice(1, 4).map(Number);
  if (channels.some((channel) => channel > 255)) return null;
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Values the API accepts for `textStyle.color`: a hex colour, the `rgb()` form
 * that `style.color` reads back as after a copy/paste inside the editor, or one
 * of the theme tokens this module renders the palette neutrals as.
 */
export function isAllowedTextColor(color: string): boolean {
  const value = color.trim();
  return (
    HEX_COLOR.test(value) ||
    THEME_TEXT_COLOR_TOKENS.includes(value) ||
    rgbToHex(value) !== null
  );
}

/**
 * Resolve a stored colour for rendering. Lexical hexes and the `rgb()` form
 * that `style.color` reads back as (copy/paste inside the editor, stored HTML)
 * both map to their token; tokens and chromatic colours pass through.
 */
export function resolveTextColor(color: string): string {
  const value = color.trim().toLowerCase();
  if (!value) return "";
  const hex = value.startsWith("rgb") ? rgbToHex(value) : value;
  if (!hex) return color;
  return THEME_TOKEN_BY_COLOR[hex] ?? color;
}

/**
 * Posts stored without a `contentJson` document are rendered straight from
 * their saved HTML, where the same frozen colours sit inside `style`
 * attributes. Rewrite the `color` declaration only — never `background-color`,
 * which those legacy posts also use for callouts.
 */
export function resolveTextColorsInHtml(html: string): string {
  return html.replace(
    /(?<![\w-])color:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g,
    (declaration, value: string) => {
      const resolved = resolveTextColor(value);
      return resolved === value ? declaration : `color: ${resolved}`;
    }
  );
}