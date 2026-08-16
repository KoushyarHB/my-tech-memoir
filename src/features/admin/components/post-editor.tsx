"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { MemoirImage } from "./memoir-image";
import type { TiptapDocument } from "@/features/blog/types/document";
import { hasDocumentText } from "@/features/blog/types/document";
import { SlashCommandExtension } from "./slash-command";
import { Callout } from "./callout";

const lowlight = createLowlight(common);

type PostEditorProps = {
  initialContent?: string;
  initialContentJson?: TiptapDocument | null;
  document?: TiptapDocument | null;
  onChange?: (html: string) => void;
  onDocumentChange?: (document: TiptapDocument) => void;
  onReady?: () => void;
  editable?: boolean;
};

function initialEditorContent(
  document: TiptapDocument | null | undefined,
  initialContentJson: TiptapDocument | null | undefined,
  initialContent: string
) {
  if (document && hasDocumentText(document)) return document;
  if (initialContentJson && hasDocumentText(initialContentJson)) return initialContentJson;
  return initialContent;
}

export function PostEditor({
  initialContent = "",
  initialContentJson,
  document,
  onChange,
  onDocumentChange,
  onReady,
  editable = true,
}: PostEditorProps) {
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const onDocumentChangeRef = useRef(onDocumentChange);
  const didInitRef = useRef(false);
  const didSyncDocumentRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onReadyRef.current = onReady;
  });
  useEffect(() => {
    onDocumentChangeRef.current = onDocumentChange;
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({
        placeholder: "Start writing your post…",
      }),
      Typography,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      SlashCommandExtension,
      Callout,
      MemoirImage,
    ],
    content: initialEditorContent(document, initialContentJson, initialContent),
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-memoir memoir-editor-canvas min-h-[420px] max-w-none px-5 py-8 focus:outline-none sm:px-10 sm:py-12",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current?.(ed.getHTML());
      onDocumentChangeRef.current?.(ed.getJSON() as TiptapDocument);
    },
    onCreate: ({ editor: ed }) => {
      if (!didInitRef.current) {
        didInitRef.current = true;
        onDocumentChangeRef.current?.(ed.getJSON() as TiptapDocument);
        onReadyRef.current?.();
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || !document) return;

    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(document);
    if (current === next) {
      didSyncDocumentRef.current = true;
      return;
    }

    // First pass: keep legacy HTML if the parent still has an empty placeholder
    // document. Once Markdown (or anything else) supplies real JSON, apply it.
    if (!didSyncDocumentRef.current) {
      didSyncDocumentRef.current = true;
      if (!hasDocumentText(document)) return;
    }

    // Keep emitUpdate false to avoid a contentJson echo loop; push HTML so saves stay dirty-aware.
    editor.commands.setContent(document, { emitUpdate: false });
    onChangeRef.current?.(editor.getHTML());
  }, [editor, document]);

  return (
    <div className="memoir-editor-shell">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
