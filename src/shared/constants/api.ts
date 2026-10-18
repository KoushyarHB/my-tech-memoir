/** Shared kernel: default messages used by route handlers. */

export const API_MESSAGES = {
  forbidden: "Forbidden",
  unauthorized: "Authentication required",
  invalidQuery: "Invalid query parameters",
  notFound: "Not found",
  unexpected: "Something went wrong",
} as const;
