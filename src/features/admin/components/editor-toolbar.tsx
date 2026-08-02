"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EditorToolbarProps = {
  editor: Editor | null;
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const tools = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      label: "Bold",
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      label: "Italic",
    },
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
      label: "Heading 1",
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      label: "Heading 2",
    },
    {
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
      label: "Heading 3",
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      label: "Bullet list",
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      label: "Ordered list",
    },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
      label: "Blockquote",
    },
    {
      icon: Code,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      active: editor.isActive("codeBlock"),
      label: "Code block",
    },
    {
      icon: Minus,
      action: () => editor.chain().focus().setHorizontalRule().run(),
      active: false,
      label: "Horizontal rule",
    },
    {
      icon: LinkIcon,
      action: () => {
        const url = window.prompt("Enter URL");
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      },
      active: editor.isActive("link"),
      label: "Link",
    },
    {
      icon: ImageIcon,
      action: async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.append("file", file);
          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            const json = await res.json();
            const url = json.data?.url;
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          } catch (err) {
            console.error("Image upload failed:", err);
            alert("Failed to upload image");
          }
        };
        input.click();
      },
      active: false,
      label: "Image",
    },
  ];

  const history = [
    {
      icon: Undo2,
      action: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
      label: "Undo",
    },
    {
      icon: Redo2,
      action: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
      label: "Redo",
    },
  ];

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-card p-2">
      {tools.map((tool) => (
        <Button
          key={tool.label}
          variant={tool.active ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={tool.action}
          aria-label={tool.label}
          title={tool.label}
          type="button"
        >
          <tool.icon className={cn("size-4", tool.active && "text-primary")} />
        </Button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      {history.map((tool) => (
        <Button
          key={tool.label}
          variant="ghost"
          size="icon-sm"
          onClick={tool.action}
          disabled={tool.disabled}
          aria-label={tool.label}
          title={tool.label}
          type="button"
        >
          <tool.icon className="size-4" />
        </Button>
      ))}
    </div>
  );
}
