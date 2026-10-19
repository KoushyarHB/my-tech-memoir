import { cookies } from "next/headers";
import { auth } from "@/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  APPEARANCE_COOKIE,
  appearanceCookieOptions,
  encodeAppearanceCookie,
} from "@/features/appearance/lib/cookie";
import {
  getUserAppearance,
  updateUserAppearance,
} from "@/features/appearance/server/appearance-service";
import type { AppearancePreferences } from "@/features/appearance/types";

/**
 * GET /api/appearance
 *
 * The signed-in user's stored preferences, or `null` when they have never
 * customised anything. `null` is meaningful: the client uses it to adopt the
 * browser's existing local preferences on first sign-in instead of overwriting
 * them with defaults.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Authentication required", { status: 401 });
  }

  try {
    return apiSuccess({ preferences: await getUserAppearance(session.user.id) });
  } catch (error) {
    console.error("Failed to load appearance:", error);
    return apiError("Failed to load appearance", { status: 500 });
  }
}

/**
 * PATCH /api/appearance
 *
 * Saves preferences for the account **and** mirrors them into a readable
 * cookie, so the next cold load is painted correctly from `<head>` without a
 * database round-trip.
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Authentication required", { status: 401 });
  }

  let body: Partial<AppearancePreferences>;
  try {
    body = (await request.json()) as Partial<AppearancePreferences>;
  } catch {
    return apiError("Invalid request body", { status: 400 });
  }

  try {
    const preferences = await updateUserAppearance(session.user.id, body);

    const cookieStore = await cookies();
    cookieStore.set(
      APPEARANCE_COOKIE,
      encodeAppearanceCookie(preferences),
      appearanceCookieOptions()
    );

    return apiSuccess({ preferences });
  } catch (error) {
    console.error("Failed to save appearance:", error);
    return apiError("Failed to save appearance", { status: 500 });
  }
}