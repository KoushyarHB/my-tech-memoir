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

/**
 * Appearance domain: the pre-paint bootstrap script.
 *
 * Runs synchronously in `<head>` so the first frame already has the right
 * theme class and appearance attributes — no flash of the wrong theme, and no
 * layout shift when a reader has picked a larger text size.
 *
 * The script deliberately mirrors `parsePreferences` + `applyAppearance` but
 * carries **no design tokens**: colours and sizes live in `globals.css` under
 * `[data-accent]` / `[data-reading-*]`, so there is nothing to keep in sync
 * here beyond the list of valid values.
 */

const config = {
  version: APPEARANCE_VERSION,
  key: APPEARANCE_STORAGE_KEY,
  legacyKey: LEGACY_THEME_STORAGE_KEY,
  defaults: {
    theme: DEFAULT_APPEARANCE.theme,
    accent: DEFAULT_APPEARANCE.accent,
    readingSize: DEFAULT_APPEARANCE.readingSize,
    readingWidth: DEFAULT_APPEARANCE.readingWidth,
  },
  themes: THEME_OPTIONS.map((option) => option.value),
  accents: ACCENT_OPTIONS.map((option) => option.value),
  sizes: READING_SIZE_OPTIONS.map((option) => option.value),
  widths: READING_WIDTH_OPTIONS.map((option) => option.value),
};

function buildScript(): string {
  return `(function(){try{
var c=${JSON.stringify(config)};
var d=document.documentElement;
var p=null;
try{var raw=localStorage.getItem(c.key);if(raw){p=JSON.parse(raw)}}catch(e){}
if(!p||typeof p!=="object"){
  p={};
  try{var legacy=localStorage.getItem(c.legacyKey);if(legacy){p.theme=legacy}}catch(e){}
}
function pick(v,list,fallback){return list.indexOf(v)>=0?v:fallback}
var theme=pick(p.theme,c.themes,c.defaults.theme);
var accent=pick(p.accent,c.accents,c.defaults.accent);
var size=pick(p.readingSize,c.sizes,c.defaults.readingSize);
var width=pick(p.readingWidth,c.widths,c.defaults.readingWidth);
var reduce=p.reduceMotion===true;
var resolved=theme==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):theme;
if(resolved==="dark"){d.classList.add("dark")}else{d.classList.remove("dark")}
d.dataset.accent=accent;
d.dataset.readingSize=size;
d.dataset.readingWidth=width;
d.dataset.reduceMotion=reduce?"true":"false";
d.style.colorScheme=resolved;
}catch(e){}})();`;
}

export const APPEARANCE_SCRIPT = buildScript();
