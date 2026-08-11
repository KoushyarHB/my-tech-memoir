import type { Editor } from "@tiptap/react";
import { toast } from "sonner";

/** Open a file picker, upload to /api/upload, and insert a Memoir image node. */
export function uploadEditorImage(editor: Editor) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.data?.url) throw new Error(json?.error ?? "Upload failed");
      editor.chain().focus().setMemoirImage({ src: json.data.url, align: "center", width: 100 }).run();
      toast.success("Image inserted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    }
  };
  input.click();
}
