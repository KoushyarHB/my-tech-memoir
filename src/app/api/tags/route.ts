import { apiSuccess, apiError } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export async function GET() {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return apiSuccess(tags);
}
