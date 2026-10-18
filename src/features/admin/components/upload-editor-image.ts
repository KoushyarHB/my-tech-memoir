import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api-client";

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
      const { url } = await api.upload<{ url: string }>("/api/upload", formData);
      if (!url) throw new Error("Upload failed");
      editor.chain().focus().setMemoirImage({ src: url, align: "center", width: 100 }).run();
      toast.success("Image inserted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Image upload failed"));
    }
  };
  input.click();
}
