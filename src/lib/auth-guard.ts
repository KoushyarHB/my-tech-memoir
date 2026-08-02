import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Server Component guard — redirects if not EDITOR or ADMIN.
 * Use in layouts and pages.
 */
export async function requireEditor(): Promise<Session> {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.role !== "EDITOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}

/**
 * API Route guard — returns null if not EDITOR or ADMIN.
 * Use in route handlers to return 403.
 */
export async function requireEditorApi(): Promise<Session | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  if (session.user.role !== "EDITOR" && session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}
