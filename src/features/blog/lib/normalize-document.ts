import type { TiptapDocument, TiptapNode } from "../types/document";
import { INLINE_NODE_TYPES } from "../types/document";

/** The app's heading model is h1–h3; deeper levels would be rejected on save. */
const MAX_HEADING_LEVEL = 3;

/**
 * Normalize a parsed document so it always matches what the editor, the API
 * validator, and the renderer expect.
 *
 * - Headings are clamped to levels 1–3. A Markdown paste containing `####`
 *   would otherwise produce a document the API rejects with
 *   "Heading level must be 1, 2, or 3" and the post cannot be saved.
 * - A paragraph (or heading) that contains block nodes has those blocks
 *   hoisted out after it. `TiptapContent` renders every paragraph as `<p>`,
 *   so a paragraph inside a paragraph would emit `<p><p>` — invalid HTML
 *   that React reports as a hydration error.
 * - Nested `doc` nodes are flattened.
 */
export function normalizeTiptapDocument(document: TiptapDocument): TiptapDocument {
  return { ...document, content: (document.content ?? []).flatMap(normalizeNode) };
}

function normalizeNode(node: TiptapNode): TiptapNode[] {
  if (node.type === "doc") {
    return (node.content ?? []).flatMap(normalizeNode);
  }

  const next: TiptapNode = { ...node };

  if (next.type === "heading") {
    const level = typeof next.attrs?.level === "number" ? next.attrs.level : 2;
    next.attrs = {
      ...next.attrs,
      level: Math.min(MAX_HEADING_LEVEL, Math.max(1, Math.round(level))),
    };
  }

  const children = next.content ?? [];
  if (children.length === 0) {
    return [next];
  }

  if (next.type === "paragraph" || next.type === "heading") {
    const inline = children.filter((child) => INLINE_NODE_TYPES.has(child.type));
    const blocks = children.filter((child) => !INLINE_NODE_TYPES.has(child.type));
    if (blocks.length === 0) {
      return [next];
    }
    const kept = inline.length > 0 ? [{ ...next, content: inline }] : [];
    return [...kept, ...blocks.flatMap(normalizeNode)];
  }

  next.content = children.flatMap(normalizeNode);
  return [next];
}