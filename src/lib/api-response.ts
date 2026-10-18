import { NextResponse } from "next/server";
import { FilterExpressionError } from "@/shared/lib/filter-expression";
import { QueryValidationError } from "@/shared/lib/pagination";
import type { ApiResponse } from "@/shared/types/api";
import type { PaginatedResult } from "@/shared/types/pagination";

interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

export function apiSuccess<T>(
  data: T,
  options?: ResponseOptions
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    {
      status: options?.status ?? 200,
      headers: options?.headers,
    }
  );
}

export function apiError(
  error: string,
  options?: ResponseOptions
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, error },
    {
      status: options?.status ?? 500,
      headers: options?.headers,
    }
  );
}

/**
 * Paginated list reply.
 *
 * `data` is a `PaginatedResult<T>` (`page`, `pageSize`, `totalItems`,
 * `totalPages`, `items`) — the same shape tms-backend returns, so clients can
 * share pagination code between the two APIs.
 */
export function apiPaginated<T>(
  result: PaginatedResult<T>,
  options?: ResponseOptions
): NextResponse<ApiResponse<PaginatedResult<T>>> {
  return apiSuccess(result, options);
}

/**
 * Maps query-validation failures to a 400. Returns `null` for anything else so
 * callers can fall through to their own 500 handling.
 */
export function apiQueryError(error: unknown): NextResponse<ApiResponse<null>> | null {
  if (error instanceof QueryValidationError) {
    return apiError(error.message, { status: 400 });
  }
  if (error instanceof FilterExpressionError) {
    return apiError(error.message, { status: 400 });
  }
  return null;
}
