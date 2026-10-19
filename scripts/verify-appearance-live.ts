/**
 * Live check: per-account appearance persistence.
 * Writes to a throwaway user, then removes it.
 */
import { db } from "../src/lib/db";
import {
  getUserAppearance,
  updateUserAppearance,
  resetUserAppearance,
} from "../src/features/appearance/server/appearance-service";
import {
  decodeAppearanceCookie,
  encodeAppearanceCookie,
} from "../src/features/appearance/lib/cookie";
import { getDefaultPreferences } from "../src/features/appearance/lib/preferences";

async function main() {
  const email = `appearance-verify-${Date.now()}@example.com`;

  const user = await db.user.create({
    data: { email, name: "Appearance Verify", role: "USER" },
    select: { id: true, appearance: true },
  });
  console.log(`created user ${user.id}`);

  // 1. A new account has never customised anything.
  const initial = await getUserAppearance(user.id);
  console.log(`initial -> ${initial === null ? "null" : JSON.stringify(initial)}`);
  if (initial !== null) throw new Error("new user should have null appearance");

  // 2. Save a full set of preferences.
  const saved = await updateUserAppearance(user.id, {
    theme: "light",
    accent: "emerald",
    readingSize: "lg",
    readingWidth: "wide",
    reduceMotion: true,
  });
  console.log(`saved -> ${saved.theme}/${saved.accent}/${saved.readingSize}/${saved.readingWidth}/${saved.reduceMotion}`);

  // 3. They survive a re-read (i.e. they are really in the database).
  const reread = await getUserAppearance(user.id);
  if (JSON.stringify(reread) !== JSON.stringify(saved)) {
    throw new Error("preferences did not persist");
  }
  console.log("re-read matches  OK");

  // 4. The cookie built from the stored row round-trips.
  const cookie = encodeAppearanceCookie(reread!);
  const decoded = decodeAppearanceCookie(cookie);
  if (JSON.stringify(decoded) !== JSON.stringify(reread)) {
    throw new Error("cookie does not mirror the stored row");
  }
  console.log(`cookie mirrors row (${cookie.length} bytes)  OK`);

  // 5. Invalid values are clamped, not rejected.
  const clamped = await updateUserAppearance(user.id, {
    theme: "neon" as never,
    accent: "chartreuse" as never,
    readingSize: "xl" as never,
  });
  console.log(`clamped -> ${clamped.theme}/${clamped.accent}/${clamped.readingSize}`);
  if (clamped.theme !== "dark" || clamped.accent !== "default" || clamped.readingSize !== "md") {
    throw new Error("invalid values were not clamped to defaults");
  }

  // 6. Resetting clears the column back to NULL (so the next sign-in adopts
  //    the browser's preferences again).
  await resetUserAppearance(user.id);
  const afterReset = await getUserAppearance(user.id);
  if (afterReset !== null) throw new Error("reset should null the column");
  console.log("reset -> null  OK");

  // 7. A signed-in user's row is independent of another user's.
  const other = await db.user.create({
    data: { email: `appearance-verify-other-${Date.now()}@example.com`, role: "USER" },
    select: { id: true },
  });
  await updateUserAppearance(other.id, { theme: "light", accent: "rose" });
  const otherPrefs = await getUserAppearance(other.id);
  const firstPrefs = await getUserAppearance(user.id);
  console.log(`isolation -> user1=${firstPrefs === null ? "null" : firstPrefs.accent}, user2=${otherPrefs?.accent}`);
  if (firstPrefs !== null) throw new Error("users should not share appearance");
  if (otherPrefs?.accent !== "rose") throw new Error("second user not stored independently");

  await db.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
  const remaining = await db.user.count({ where: { id: { in: [user.id, other.id] } } });
  if (remaining !== 0) throw new Error("cleanup failed");

  // Sanity: defaults are still what we think they are.
  console.log(`defaults -> ${JSON.stringify(getDefaultPreferences())}`);
  console.log("\nappearance persistence live check passed");
}

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("FAILED:", error);
    await db.$disconnect();
    process.exit(1);
  });
