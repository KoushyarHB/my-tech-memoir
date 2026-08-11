import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Window } from "happy-dom";
import { common, createLowlight } from "lowlight";
import { Callout } from "@/features/admin/components/callout";
import {
  type TiptapDocument,
  type TiptapNode,
  validateTiptapDocument,
} from "@/features/blog/types/document";

const lowlight = createLowlight(common);

/** TipTap generateJSON needs a DOM; provide one for Node scripts. */
function ensureDom() {
  if (typeof globalThis.window !== "undefined" && typeof globalThis.document !== "undefined") {
    return;
  }
  const window = new Window({ url: "https://localhost/" });
  Object.defineProperty(globalThis, "window", { value: window, configurable: true });
  Object.defineProperty(globalThis, "document", {
    value: window.document,
    configurable: true,
  });
  Object.defineProperty(globalThis, "DOMParser", {
    value: window.DOMParser,
    configurable: true,
  });
  Object.defineProperty(globalThis, "Node", {
    value: window.Node,
    configurable: true,
  });
  Object.defineProperty(globalThis, "HTMLElement", {
    value: window.HTMLElement,
    configurable: true,
  });
}

type MemoirImageAlign =
  | "center"
  | "left"
  | "right"
  | "wrap-left"
  | "wrap-right";

function clampWidth(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(25, Math.round(n)));
}

function parseAlign(value: unknown): MemoirImageAlign {
  const allowed: MemoirImageAlign[] = [
    "center",
    "left",
    "right",
    "wrap-left",
    "wrap-right",
  ];
  return allowed.includes(value as MemoirImageAlign)
    ? (value as MemoirImageAlign)
    : "center";
}

function parseWidthFromElement(element: HTMLElement): number {
  const data = element.getAttribute("data-width");
  if (data) return clampWidth(Number(data));

  const styleWidth = element.style.width;
  if (styleWidth.endsWith("%")) {
    return clampWidth(Number.parseFloat(styleWidth));
  }

  return 100;
}

/** Headless image schema matching the editor (no React node view). */
const BackfillImage = Image.extend({
  name: "image",
  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      resize: false,
    };
  },
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: 100,
        parseHTML: (element) => {
          const host =
            element.closest("figure.memoir-figure") ?? (element as HTMLElement);
          return parseWidthFromElement(host as HTMLElement);
        },
        renderHTML: () => ({}),
      },
      align: {
        default: "center" satisfies MemoirImageAlign,
        parseHTML: (element) => {
          const host =
            (element.closest("figure.memoir-figure") as HTMLElement | null) ??
            (element as HTMLElement);
          const data = host.getAttribute("data-align");
          if (data) return parseAlign(data);
          const match = Array.from(host.classList).find((c) =>
            c.startsWith("memoir-figure--")
          );
          if (match) return parseAlign(match.replace("memoir-figure--", ""));
          return "center";
        },
        renderHTML: () => ({}),
      },
      caption: {
        default: "",
        parseHTML: (element) => {
          const figure =
            element.closest("figure.memoir-figure") ??
            (element.tagName === "FIGURE" ? element : null);
          if (!figure) return "";
          const caption = figure.querySelector("figcaption");
          return caption?.textContent?.trim() ?? "";
        },
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure.memoir-figure",
        getAttrs: (node) => {
          const el = node as HTMLElement;
          const img = el.querySelector("img");
          if (!img?.getAttribute("src")) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            title: img.getAttribute("title"),
            width: parseWidthFromElement(el),
            align: parseAlign(
              el.getAttribute("data-align") ??
                Array.from(el.classList)
                  .find((c) => c.startsWith("memoir-figure--"))
                  ?.replace("memoir-figure--", "")
            ),
            caption: el.querySelector("figcaption")?.textContent?.trim() ?? "",
          };
        },
      },
      {
        tag: 'img[src]:not([src^="data:"])',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          if (el.closest("figure.memoir-figure")) return false;
          return {
            src: el.getAttribute("src"),
            alt: el.getAttribute("alt"),
            title: el.getAttribute("title"),
            width: 100,
            align: "center",
            caption: "",
          };
        },
      },
    ];
  },
});

const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    codeBlock: false,
    link: false,
  }),
  TextStyle,
  Color,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: "text-primary underline" },
  }),
  Table,
  TableRow,
  TableHeader,
  TableCell,
  CodeBlockLowlight.configure({ lowlight }),
  Callout,
  BackfillImage,
];

function clampHeadingLevels(node: TiptapNode): TiptapNode {
  const next: TiptapNode = { ...node };
  if (next.type === "heading") {
    const level = typeof next.attrs?.level === "number" ? next.attrs.level : 2;
    next.attrs = { ...next.attrs, level: Math.min(3, Math.max(1, level)) };
  }
  if (next.type === "codeBlock" && next.attrs) {
    const language = next.attrs.language;
    if (language == null || language === "") {
      const { language: _drop, ...rest } = next.attrs;
      next.attrs = rest;
    } else if (typeof language !== "string") {
      next.attrs = { ...next.attrs, language: String(language) };
    }
  }
  if (next.content) {
    next.content = next.content.map(clampHeadingLevels);
  }
  return next;
}

/** Normalize TipTap parse quirks so documents pass app validation. */
function normalizeDocument(node: TiptapNode): TiptapNode {
  return clampHeadingLevels(node);
}

/**
 * Convert stored post HTML into a validated TipTap document.
 * Used by admin hydration paths and one-off backfill scripts.
 */
export function htmlToTiptapDocument(html: string): TiptapDocument {
  ensureDom();
  const raw = generateJSON(html || "<p></p>", EXTENSIONS) as TiptapDocument;
  const normalized: TiptapDocument = {
    type: "doc",
    content: (raw.content ?? []).map(normalizeDocument),
  };
  return validateTiptapDocument(normalized);
}
