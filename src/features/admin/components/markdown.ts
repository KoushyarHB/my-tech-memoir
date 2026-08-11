import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import type { TiptapDocument } from "@/features/blog/types/document";

const markdown = new MarkdownManager({
  extensions: [StarterKit, Link, Table, TableRow, TableHeader, TableCell],
});

export function documentToMarkdown(document: TiptapDocument): string {
  return markdown.serialize(document as never);
}

export function markdownToDocument(source: string): TiptapDocument {
  return markdown.parse(source) as unknown as TiptapDocument;
}
