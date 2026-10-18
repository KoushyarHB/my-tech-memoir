import { apiError, apiSuccess } from "@/lib/api-response";
import { requireEditorApi } from "@/lib/auth-guard";
import {
  getDashboardTrends,
  normalizeDashboardRange,
} from "@/features/admin/server/dashboard-service";

/**
 * GET /api/dashboard/trends?range=14d
 *
 * Returns both chart series for the requested window. Unknown ranges fall back
 * to the default rather than failing, so a stale bookmark still renders.
 */
export async function GET(request: Request) {
  const session = await requireEditorApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = normalizeDashboardRange(searchParams.get("range"));
    return apiSuccess(await getDashboardTrends(range));
  } catch (error) {
    console.error("Failed to load dashboard trends:", error);
    return apiError("Failed to load dashboard trends", { status: 500 });
  }
}
