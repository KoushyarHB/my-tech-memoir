import { parsePreferences } from "../lib/preferences";
import type { AppearancePatch, AppearancePreferences } from "../types";
import {
  clearUserAppearance,
  findUserAppearance,
  saveUserAppearance,
} from "./appearance-repository";

/**
 * Appearance domain: business rules.
 *
 * The server stores exactly what the client sends, after validation. There is
 * no per-field merge here because the client already holds the merged state;
 * accepting a partial patch would risk clobbering fields it did not mention.
 */

export async function getUserAppearance(
  userId: string
): Promise<AppearancePreferences | null> {
  return findUserAppearance(userId);
}

export async function updateUserAppearance(
  userId: string,
  input: AppearancePatch & { version?: number }
): Promise<AppearancePreferences> {
  // Re-validate: an unknown theme/accent/size falls back to its default rather
  // than rejecting, matching how the client parses storage.
  const preferences = parsePreferences(input);
  return saveUserAppearance(userId, preferences);
}

export async function resetUserAppearance(userId: string): Promise<void> {
  await clearUserAppearance(userId);
}
