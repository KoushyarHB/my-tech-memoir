import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MemoirImageView } from "./memoir-image-view";

export type MemoirImageAlign =
  | "center"
  | "left"
  | "right"
  | "wrap-left"
  | "wrap-right";

export type MemoirImageAttrs = {
  src: string;
  alt?: string;
  title?: string;
  width: number;
  align: MemoirImageAlign;
  caption: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    memoirImage: {
      setMemoirImage: (
        options: Partial<MemoirImageAttrs> & { src: string }
      ) => ReturnType;
      updateMemoirImage: (options: Partial<MemoirImageAttrs>) => ReturnType;
    };
  }
}

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

export const MemoirImage = Image.extend({
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
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: 100,
        parseHTML: (element) => {
          const host =
            element.closest("figure.memoir-figure") ??
            (element as HTMLElement);
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

  renderHTML({ node }) {
    const width = clampWidth(node.attrs.width);
    const align = parseAlign(node.attrs.align);
    const caption =
      typeof node.attrs.caption === "string" ? node.attrs.caption.trim() : "";

    const figureAttrs: Record<string, string> = {
      class: `memoir-figure memoir-figure--${align}`,
      style: `width: ${width}%`,
      "data-width": String(width),
      "data-align": align,
    };

    const imgAttrs: Record<string, string> = {
      src: node.attrs.src,
    };
    if (node.attrs.alt) imgAttrs.alt = node.attrs.alt;
    if (node.attrs.title) imgAttrs.title = node.attrs.title;

    const img: [string, Record<string, string>] = ["img", imgAttrs];

    if (caption) {
      return ["figure", figureAttrs, img, ["figcaption", {}, caption]];
    }

    return ["figure", figureAttrs, img];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setMemoirImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt ?? null,
              title: options.title ?? null,
              width: clampWidth(options.width ?? 100),
              align: parseAlign(options.align ?? "center"),
              caption: options.caption ?? "",
            },
          }),
      updateMemoirImage:
        (options) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, {
            ...(options.src !== undefined ? { src: options.src } : {}),
            ...(options.alt !== undefined ? { alt: options.alt } : {}),
            ...(options.title !== undefined ? { title: options.title } : {}),
            ...(options.width !== undefined
              ? { width: clampWidth(options.width) }
              : {}),
            ...(options.align !== undefined
              ? { align: parseAlign(options.align) }
              : {}),
            ...(options.caption !== undefined
              ? { caption: options.caption }
              : {}),
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MemoirImageView, {
      className: "memoir-image-node",
    });
  },
});
