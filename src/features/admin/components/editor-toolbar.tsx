"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!editor) return null;

  function openLinkDialog() {
    const previous = editor?.getAttributes("link").href ?? "";
    setLinkUrl(typeof previous === "string" ? previous : "");
    setLinkOpen(true);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!editor) return;

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkOpen(false);
    setLinkUrl("");
  }

  async function uploadImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;

      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(json?.error || "Upload failed");
        }

        const url = json?.data?.url;
        if (!url) {
          throw new Error("Upload response missing image URL");
        }

        editor.chain().focus().setMemoirImage({
          src: url,
          align: "center",
          width: 100,
        }).run();
        toast.success("Image uploaded");
      } catch (err) {
        console.error("Image upload failed:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to upload image"
        );
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

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
      action: openLinkDialog,
      active: editor.isActive("link"),
      label: "Link",
    },
    {
      icon: ImageIcon,
      action: () => void uploadImage(),
      active: false,
      label: "Image",
      disabled: uploading,
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
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-card p-2">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            variant={tool.active ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={tool.action}
            disabled={"disabled" in tool ? tool.disabled : false}
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

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add link</DialogTitle>
            <DialogDescription>
              Enter a URL. Leave empty and confirm to remove the current link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="editor-link-url">URL</Label>
            <Input
              id="editor-link-url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyLink}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
