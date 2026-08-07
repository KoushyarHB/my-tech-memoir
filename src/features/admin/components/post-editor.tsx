"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect, useRef } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { MemoirImage } from "./memoir-image";

type PostEditorProps = {
  initialContent?: string;
  onChange?: (html: string) => void;
  onReady?: () => void;
  editable?: boolean;
};

export function PostEditor({
  initialContent = "",
  onChange,
  onReady,
  editable = true,
}: PostEditorProps) {
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const didInitRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({
        placeholder: "Start writing your post…",
      }),
      Typography,
      MemoirImage,
    ],
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-memoir min-h-[280px] max-w-none px-3 py-3 focus:outline-none sm:min-h-[400px] sm:px-5 sm:py-4",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current?.(ed.getHTML());
    },
    onCreate: () => {
      if (!didInitRef.current) {
        didInitRef.current = true;
        onReadyRef.current?.();
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
