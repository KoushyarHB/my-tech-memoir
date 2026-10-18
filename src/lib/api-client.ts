/**
 * Small typed wrapper around `fetch` for the route handlers.
 *
 * Every handler replies with the `{ success, data, error }` envelope from
 * `@/lib/api-response`, so this unwraps `data` and turns failed requests into
 * `ApiError` instances that TanStack Query can surface to callers.
 *
 * This is the only module in the client bundle that should call `fetch`.
 */

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function unwrap<T>(json: ApiEnvelope<T> | null, status: number): T {
  if (json?.success === false || status >= 400) {
    throw new ApiError(
      json?.error ?? `Request failed with status ${status}`,
      status
    );
  }

  // Prefer the envelope's `data` field (it may legitimately be `false` or `0`).
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(
  url: string,
  { body, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // DELETE handlers reply with 204 No Content.
  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  return unwrap(json, response.status);
}

/**
 * `FormData` must not be JSON-encoded or given a `Content-Type` header, so
 * uploads take their own path instead of going through `apiRequest`.
 */
export async function apiUpload<T>(
  url: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(url, { method: "POST", body: formData });
  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  return unwrap(json, response.status);
}

export const api = {
  get: <T>(url: string) => apiRequest<T>(url, { method: "GET", cache: "no-store" }),
  post: <T>(url: string, body?: unknown) =>
    apiRequest<T>(url, { method: "POST", body }),
  put: <T>(url: string, body?: unknown) =>
    apiRequest<T>(url, { method: "PUT", body }),
  patch: <T>(url: string, body?: unknown) =>
    apiRequest<T>(url, { method: "PATCH", body }),
  delete: <T = void>(url: string) => apiRequest<T>(url, { method: "DELETE" }),
  upload: apiUpload,
};

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
