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

    // Vercel serverless body limit is ~4.5MB for server uploads
    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      return apiError("Image must be 4MB or smaller", { status: 400 });
    }

    const filename = `posts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;

    // Must match the Blob store access mode (Public vs Private) chosen at creation.
    // Blog images need a Public store so <img src> works without auth.
    const access =
      process.env.BLOB_ACCESS === "private" ? "private" : "public";

    const blob = await put(filename, file, {
      access,
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return apiSuccess({ url: blob.url });
  } catch (error) {
    console.error("Upload failed:", error);
    const raw =
      error instanceof Error ? error.message : "Failed to upload image";

    // Private stores cannot serve public blog <img> URLs — guide the fix.
    if (/private store/i.test(raw) || /public access on a private/i.test(raw)) {
      return apiError(
        "Your Vercel Blob store is Private. Create a new Public Blob store in Vercel Storage, connect it to this project, then redeploy.",
        { status: 500 }
      );
    }

    return apiError(raw, { status: 500 });
  }
}
