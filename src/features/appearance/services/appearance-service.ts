import { api } from "@/lib/api-client";
import type { AppearancePreferences } from "../types";

/** Appearance domain: client-side API functions. */

export async function fetchAppearance(): Promise<AppearancePreferences | null> {
  const data = await api.get<{ preferences: AppearancePreferences | null }>(
    "/api/appearance"
  );
  return data?.preferences ?? null;
}

export async function saveAppearance(
  preferences: AppearancePreferences
): Promise<AppearancePreferences> {
  const data = await api.patch<{ preferences: AppearancePreferences }>(
    "/api/appearance",
    preferences
  );
  return data.preferences;
}
