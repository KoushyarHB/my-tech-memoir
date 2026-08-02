"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
import { EditorToolbar } from "./editor-toolbar";

type PostEditorProps = {
  initialContent?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
};

export function PostEditor({
  initialContent = "",
  onChange,
  editable = true,
}: PostEditorProps) {
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
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: "rounded-lg border border-border",
        },
      }),
    ],
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-memoir min-h-[400px] max-w-none focus:outline-none px-5 py-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const current = editor.getHTML();
      if (current !== initialContent) {
        editor.commands.setContent(initialContent || "", { emitUpdate: false });
      }
    }
  }, [editor, initialContent]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
