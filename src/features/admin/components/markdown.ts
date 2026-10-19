import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { normalizeTiptapDocument } from "@/features/blog/lib/normalize-document";
import type { TiptapDocument } from "@/features/blog/types/document";

// StarterKit already registers Link; `link: false` keeps the explicit
// extension below as the only one (otherwise TipTap warns about duplicates).
const markdown = new MarkdownManager({
  extensions: [
    StarterKit.configure({ link: false }),
    Link,
    Table,
    TableRow,
    TableHeader,
    TableCell,
  ],
});

export function documentToMarkdown(document: TiptapDocument): string {
  return markdown.serialize(document as never);
}

/**
 * Parse pasted Markdown into a document the editor, the API validator, and
 * the renderer all accept. Normalization clamps heading levels and unwraps
 * invalid nesting (e.g. a paragraph inside a paragraph), which would
 * otherwise render as `<p><p>` and trigger a React hydration error.
 */
export function markdownToDocument(source: string): TiptapDocument {
  return normalizeTiptapDocument(markdown.parse(source) as unknown as TiptapDocument);
}
