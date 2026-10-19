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
import { APPEARANCE_COOKIE } from "./cookie";

/**
 * Appearance domain: the pre-paint bootstrap script.
 *
 * Runs synchronously in `<head>` so the first frame already has the right
 * theme class and appearance attributes — no flash, and no layout shift when a
 * reader has picked a larger text size.
 *
 * Source order matters:
 *   1. the cookie  — written on every change and by the save endpoint, so a
 *                    signed-in user's server-stored preferences paint without
 *                    waiting for the database
 *   2. localStorage — the anonymous / pre-cookie path
 *   3. legacy key  — one-time migration from the theme-only era
 *   4. defaults
 *
 * The script carries **no design tokens**: colours and sizes live in
 * `globals.css` under `[data-accent]` / `[data-reading-*]`.
 */

const config = {
  version: APPEARANCE_VERSION,
  key: APPEARANCE_STORAGE_KEY,
  cookie: APPEARANCE_COOKIE,
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
function pick(v,list,fallback){return list.indexOf(v)>=0?v:fallback}

// 1. Cookie (short keys: v,t,a,s,w,m).
var p=null;
try{
  var m=document.cookie.match(new RegExp("(?:^|;\\\\s*)"+c.cookie+"=([^;]*)"));
  if(m&&m[1]){
    var raw=JSON.parse(decodeURIComponent(m[1]));
    p={theme:raw.t,accent:raw.a,readingSize:raw.s,readingWidth:raw.w,reduceMotion:raw.m};
  }
}catch(e){}

// 2. localStorage, then the legacy theme-only key.
if(!p||typeof p!=="object"){
  p={};
  try{var stored=localStorage.getItem(c.key);if(stored){p=JSON.parse(stored)||{}}}catch(e){}
}
if(!p.theme){
  try{var legacy=localStorage.getItem(c.legacyKey);if(legacy){p.theme=legacy}}catch(e){}
}

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
