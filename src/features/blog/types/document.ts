export type TiptapMark = {
  type: "bold" | "italic" | "strike" | "code" | "link" | "highlight" | "textStyle";
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};

export type TiptapDocument = {
  type: "doc";
  content: TiptapNode[];
};

export const EMPTY_TIPTAP_DOCUMENT: TiptapDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "heading",
  "text",
  "hardBreak",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "image",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
  "callout",
]);

const MARK_TYPES = new Set([
  "bold",
  "italic",
  "strike",
  "code",
  "link",
  "highlight",
  "textStyle",
]);

/** Hex colors only — TipTap Color uses textStyle.color; reject CSS expressions. */
function isSafeTextColor(color: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color.trim());
}

const CALLOUT_VARIANTS = new Set(["info", "tip", "warning", "danger"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Allow http(s), same-site paths, in-page anchors, and mailto — reject javascript:/data: etc. */
function isSafeHref(href: string): boolean {
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith("#")) return true;
  if (value.startsWith("/")) return true;
  if (/^https?:\/\//i.test(value)) return true;
  if (/^mailto:[^\s]+$/i.test(value)) return true;
  return false;
}

function validateNode(node: unknown, path: string, isRoot = false): node is TiptapNode {
  if (!isRecord(node) || typeof node.type !== "string") {
    throw new Error(`Invalid document node at ${path}`);
  }
  if (!NODE_TYPES.has(node.type) || (isRoot && node.type !== "doc")) {
    throw new Error(`Unsupported document node '${node.type}' at ${path}`);
  }

  if (node.type === "text" && typeof node.text !== "string") {
    throw new Error(`Text node is missing text at ${path}`);
  }
  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) {
      throw new Error(`Node content must be an array at ${path}`);
    }
    node.content.forEach((child, index) => validateNode(child, `${path}.content[${index}]`));
  }
  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks)) {
      throw new Error(`Node marks must be an array at ${path}`);
    }
    node.marks.forEach((mark, index) => {
      if (!isRecord(mark) || typeof mark.type !== "string" || !MARK_TYPES.has(mark.type)) {
        throw new Error(`Unsupported mark at ${path}.marks[${index}]`);
      }
      if (mark.type === "link") {
        const href = isRecord(mark.attrs) ? mark.attrs.href : undefined;
        if (typeof href !== "string" || !isSafeHref(href)) {
          throw new Error(`Unsafe link at ${path}.marks[${index}]`);
        }
      }
      if (mark.type === "textStyle") {
        const color = isRecord(mark.attrs) ? mark.attrs.color : undefined;
        if (color !== undefined && color !== null) {
          if (typeof color !== "string" || !isSafeTextColor(color)) {
            throw new Error(`Invalid text color at ${path}.marks[${index}]`);
          }
        }
      }
    });
  }
  if (node.type === "heading") {
    const level = isRecord(node.attrs) ? node.attrs.level : undefined;
    if (level !== 1 && level !== 2 && level !== 3) {
      throw new Error(`Heading level must be 1, 2, or 3 at ${path}`);
    }
  }
  if (node.type === "codeBlock" && isRecord(node.attrs) && node.attrs.language !== undefined && typeof node.attrs.language !== "string") {
    throw new Error(`Code language must be a string at ${path}`);
  }
  if (node.type === "callout") {
    const variant = isRecord(node.attrs) ? node.attrs.variant : undefined;
    if (variant !== undefined && (typeof variant !== "string" || !CALLOUT_VARIANTS.has(variant))) {
      throw new Error(`Unsupported callout variant at ${path}`);
    }
  }
  return true;
}

export function validateTiptapDocument(value: unknown): TiptapDocument {
  validateNode(value, "document", true);
  const document = value as TiptapDocument;
  if (!Array.isArray(document.content)) {
    throw new Error("Document content must be an array");
  }
  return document;
}

export function isTiptapDocument(value: unknown): value is TiptapDocument {
  try {
    validateTiptapDocument(value);
    return true;
  } catch {
    return false;
  }
}

export function documentToPlainText(document: TiptapDocument): string {
  const visit = (node: TiptapNode): string => {
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return "\n";
    const content = node.content?.map(visit).join("") ?? "";
    return ["paragraph", "heading", "blockquote", "codeBlock", "callout", "listItem", "tableRow"].includes(node.type)
      ? `${content}\n`
      : content;
  };
  return visit(document).replace(/\n{3,}/g, "\n\n").trim();
}

export function hasDocumentText(document: TiptapDocument): boolean {
  return documentToPlainText(document).length > 0;
}
