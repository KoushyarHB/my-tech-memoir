import { apiError, apiPaginated, apiQueryError } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/auth-guard";
import { parsePaginationQuery } from "@/shared/lib/pagination";
import { getUsersPage } from "@/features/users/server/user-service";

/** GET /api/users — paginated user list (admin only). */
export async function GET(request: Request) {
  const session = await requireAdminApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = parsePaginationQuery(searchParams);
    const result = await getUsersPage(query);
    return apiPaginated(result);
  } catch (error) {
    const queryError = apiQueryError(error);
    if (queryError) return queryError;

    console.error("Failed to list users:", error);
    return apiError("Failed to list users", { status: 500 });
  }
}
