/**
 * Prisma client singleton for Next.js.
 *
 * In development, Next.js hot-reloads modules on every request.
 * Without a singleton, a new PrismaClient is created per reload,
 * eventually exhausting database connections.
 *
 * This pattern stores the client on `globalThis` so it persists
 * across hot-reloads in dev, and is a no-op in production.
 */

import { PrismaClient } from "../../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
