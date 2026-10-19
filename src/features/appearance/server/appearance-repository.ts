import { Prisma } from "@/lib/db";
import { db } from "@/lib/db";
import { parsePreferences } from "../lib/preferences";
import type { AppearancePreferences } from "../types";

/**
 * Appearance domain: data access.
 *
 * Stores one JSON column on `User`. Reads re-validate through
 * `parsePreferences`, so a row written by an older release cannot put the app
 * into an unknown state.
 */

export async function findUserAppearance(
  userId: string
): Promise<AppearancePreferences | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { appearance: true },
  });

  if (!user?.appearance) return null;

  return parsePreferences(user.appearance);
}

export async function saveUserAppearance(
  userId: string,
  preferences: AppearancePreferences
): Promise<AppearancePreferences> {
  const user = await db.user.update({
    where: { id: userId },
    data: { appearance: preferences as unknown as Prisma.InputJsonValue },
    select: { appearance: true },
  });

  return parsePreferences(user.appearance);
}

/** Clears the column so the next sign-in adopts local preferences again. */
export async function clearUserAppearance(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { appearance: Prisma.DbNull },
  });
}
