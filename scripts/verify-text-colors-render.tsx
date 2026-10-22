/**
 * Verifies text colours survive both themes.
 *
 * The bug: the editor's "Ink"/"Gray" swatches are the *light-mode* design
 * tokens written out as hex, and a `textStyle` colour is frozen into the
 * document as an inline style. A sentence styled "Ink" therefore stayed
 * rgb(42 41 38) on the dark canvas (#121212, ~1.3:1 contrast) while the rest of
 * the paragraph followed `--ink-secondary`.
 *
 * Covers the three surfaces that render a stored colour:
 *  - the published renderer (`TiptapContent`),
 *  - the HTML fallback for posts stored without a document (`Lighthouse`),
 *  - the editor canvas itself (the `ThemedColor` mark serialization).
 * Plus the API contract: tokens are legal, arbitrary CSS still is not.
 */
import { Window } from "happy-dom";
import { renderToStaticMarkup } from "react-dom/server";
import {
  TEXT_COLOR_SWATCHES,
  isAllowedTextColor,
  resolveTextColor,
  resolveTextColorsInHtml,
} from "../src/features/blog/constants/text-colors";
import {
  validateTiptapDocument,
  type TiptapDocument,
} from "../src/features/blog/types/document";
import { TiptapContent } from "../src/features/blog/components";

function assert(label: string, condition: boolean) {
  if (!condition) throw new Error(`FAILED: ${label}`);
  console.log("  ok —", label);
}

const STYLED_DOCUMENT: TiptapDocument = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "legacy ink hex ", marks: [{ type: "textStyle", attrs: { color: "#2a2926" } }] },
        { type: "text", text: "copied rgb ink ", marks: [{ type: "textStyle", attrs: { color: "rgb(42, 41, 38)" } }] },
        { type: "text", text: "grey ", marks: [{ type: "textStyle", attrs: { color: "#787570" } }] },
        { type: "text", text: "already themed ", marks: [{ type: "textStyle", attrs: { color: "var(--ink-primary)" } }] },
        { type: "text", text: "red stays red", marks: [{ type: "textStyle", attrs: { color: "#dc2626" } }] },
      ],
    },
  ],
};

async function checkEditorCanvas() {
  const window = new Window();
  (globalThis as unknown as { document: unknown }).document = window.document;
  (globalThis as unknown as { window: unknown }).window = window;

  const { getSchema } = await import("@tiptap/core");
  const { DOMSerializer } = await import("@tiptap/pm/model");
  const { default: StarterKit } = await import("@tiptap/starter-kit");
  const { TextStyle } = await import("@tiptap/extension-text-style");
  const { ThemedColor } = await import("../src/features/admin/components/themed-color");

  // Same extension wiring as post-editor.tsx, minus the nodes that are not
  // needed to serialize a coloured paragraph.
  const schema = getSchema([
    StarterKit.configure({ codeBlock: false, link: false }),
    TextStyle,
    ThemedColor,
  ]);

  const node = schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "canvas ink", marks: [{ type: "textStyle", attrs: { color: "#2a2926" } }] },
          { type: "text", text: " canvas red", marks: [{ type: "textStyle", attrs: { color: "#dc2626" } }] },
        ],
      },
    ],
  });

  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(node.content);
  const host = window.document.createElement("div");
  // happy-dom's DOM types are not the global `lib.dom` ones, hence the cast.
  host.appendChild(fragment as unknown as Parameters<typeof host.appendChild>[0]);
  const html = host.innerHTML;

  console.log("editor canvas html:", html);
  assert("editor canvas renders the ink swatch as var(--ink-primary)", html.includes("color: var(--ink-primary)"));
  assert("editor canvas no longer emits the frozen light-mode ink", !html.includes("#2a2926") && !html.includes("rgb(42, 41, 38)"));
  assert("editor canvas keeps chromatic colours literal", html.includes("#dc2626"));
}

function checkApiContract() {
  assert("hex colours are accepted", isAllowedTextColor("#2a2926") && isAllowedTextColor("#abc"));
  assert("the rgb() form a copy/paste produces is accepted", isAllowedTextColor("rgb(42, 41, 38)") && isAllowedTextColor("rgba(42, 41, 38, 0.4)"));
  assert("out-of-range rgb is rejected", !isAllowedTextColor("rgb(300, 0, 0)"));
  assert("theme tokens are accepted", isAllowedTextColor("var(--ink-primary)") && isAllowedTextColor("var(--ink-secondary)") && isAllowedTextColor("var(--ink-tertiary)"));
  assert("arbitrary CSS is still rejected", !isAllowedTextColor("red") && !isAllowedTextColor("var(--evil)") && !isAllowedTextColor("expression(alert(1))"));

  const valid = validateTiptapDocument(STYLED_DOCUMENT);
  assert("a document mixing hex, rgb and token colours validates", valid.content.length === 1);

  let rejected = false;
  try {
    validateTiptapDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "textStyle", attrs: { color: "url(#evil)" } }] }],
        },
      ],
    });
  } catch {
    rejected = true;
  }
  assert("an unsupported colour value is rejected", rejected);
}

function checkPublishedRenderer() {
  const html = renderToStaticMarkup(
    TiptapContent({ document: STYLED_DOCUMENT }) as unknown as React.ReactElement
  ).replace(/<!-- -->/g, "");
  console.log("published html:", html);

  assert("published post renders ink as var(--ink-primary)", html.includes("color:var(--ink-primary)") || html.includes("color: var(--ink-primary)"));
  assert("published post resolves every ink form to the token", (html.match(/var\(--ink-primary\)/g) ?? []).length === 3);
  assert("published post renders grey as var(--ink-tertiary)", html.includes("var(--ink-tertiary)"));
  assert("published post keeps red literal", html.includes("#dc2626"));
}

function checkHtmlFallback() {
  const legacy = '<p><span style="color: rgb(42, 41, 38); background-color: #dfded9;">legacy</span> <mark style="color:#787570">grey</mark> <span style="color: #dc2626">red</span></p>';
  const rewritten = resolveTextColorsInHtml(legacy);
  console.log("legacy html rewritten:", rewritten);

  assert("legacy html colour is resolved", rewritten.includes("color: var(--ink-primary)"));
  assert("legacy html backgroundColor is untouched", rewritten.includes("background-color: #dfded9"));
  assert("legacy html keeps chromatic colours", rewritten.includes("color: #dc2626"));
  assert("no leftover light ink in dark mode", !rewritten.includes("rgb(42, 41, 38)"));
}

function checkPalette() {
  const palette = TEXT_COLOR_SWATCHES.filter((swatch) => swatch.value);
  const resolved = palette.map((swatch) => ({ label: swatch.label, rendered: resolveTextColor(swatch.value as string) }));

  assert("the three neutral swatches render as tokens", resolved.filter((entry) => entry.rendered.startsWith("var(--")).length === 3);
  assert("swatch previews resolve through the theme", resolveTextColor("#2a2926") === "var(--ink-primary)" && resolveTextColor("#787570") === "var(--ink-tertiary)");
  assert("the body ink a paragraph already uses is selectable", resolveTextColor("#504e4a") === "var(--ink-secondary)");
  assert("default swatch clears the mark", TEXT_COLOR_SWATCHES.some((swatch) => swatch.value === null));
  assert("unknown colours pass through unchanged", resolveTextColor("#123456") === "#123456");
  assert("empty colour resolves to empty", resolveTextColor("") === "");
}

async function main() {
  console.log("text colour rendering");
  checkPalette();
  checkApiContract();
  checkPublishedRenderer();
  checkHtmlFallback();
  console.log("editor mark serialization");
  await checkEditorCanvas();
  console.log("\ntext colour render verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});