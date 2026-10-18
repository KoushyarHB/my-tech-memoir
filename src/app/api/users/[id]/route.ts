import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/auth-guard";
import { isUserRole } from "@/features/users/constants/roles";
import {
  updateUserRole,
  UserValidationError,
} from "@/features/users/server/user-service";
import type { UpdateUserRoleRequest } from "@/features/users/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await requireAdminApi();
  if (!session) {
    return apiError("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateUserRoleRequest;

    if (!isUserRole(body.role)) {
      return apiError("Invalid role", { status: 400 });
    }

    const user = await updateUserRole(id, body.role, session.user.id);
    return apiSuccess(user);
  } catch (error) {
    if (error instanceof UserValidationError) {
      return apiError(error.message, { status: error.status });
    }

    console.error("Failed to update user role:", error);
    return apiError("Failed to update user role", { status: 500 });
  }
}
