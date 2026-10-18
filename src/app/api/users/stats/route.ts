import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/auth-guard";
import { getUserStats } from "@/features/users/server/user-service";

/** GET /api/users/stats — aggregate counts for the admin tiles. */
export async function GET() {
  const session = await requireAdminApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    return apiSuccess(await getUserStats());
  } catch (error) {
    console.error("Failed to load user stats:", error);
    return apiError("Failed to load user stats", { status: 500 });
  }
}
