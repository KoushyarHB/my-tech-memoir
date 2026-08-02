import {
  updateUserRole,
  isUserRole,
} from "@/features/admin/server/user-service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/auth-guard";

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
    const body = (await request.json()) as { role?: string };
    const role = body.role;

    if (!isUserRole(role)) {
      return apiError("Invalid role", { status: 400 });
    }

    const user = await updateUserRole(id, role, session.user.id);
    return apiSuccess(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user role";
    const status =
      message === "User not found"
        ? 404
        : message === "Invalid role"
          ? 400
          : message.includes("demote") || message.includes("last admin")
            ? 400
            : 500;

    if (status === 500) {
      console.error("Failed to update user role:", error);
    }

    return apiError(message, { status });
  }
}
