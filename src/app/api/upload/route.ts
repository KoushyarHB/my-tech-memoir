import { put } from "@vercel/blob";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";

export async function POST(request: Request) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return apiError("BLOB_READ_WRITE_TOKEN is not configured", { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided", { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return apiError("File must be an image", { status: 400 });
    }

    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      return apiError("Image must be 10MB or smaller", { status: 400 });
    }

    const filename = `posts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return apiSuccess({ url: blob.url });
  } catch (error) {
    console.error("Upload failed:", error);
    return apiError("Failed to upload image", { status: 500 });
  }
}
