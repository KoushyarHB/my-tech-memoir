import { listUsers } from "@/features/admin/server/user-service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const users = await listUsers();
    return apiSuccess(users);
  } catch (error) {
    console.error("Failed to list users:", error);
    return apiError("Failed to list users", { status: 500 });
  }
}
