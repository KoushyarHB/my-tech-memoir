/**
 * Shared kernel: the JSON envelope every route handler replies with.
 *
 * List endpoints put a `PaginatedResult<T>` in `data`, so `data.items`,
 * `data.totalItems`, `data.totalPages`, `data.page` and `data.pageSize` match
 * tms-backend's `PaginationResult<T>`.
 */

import type { PaginatedResult } from "./pagination";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ApiSuccessResponse<T> = ApiResponse<T> & {
  success: true;
  data: T;
};

export type ApiErrorResponse = ApiResponse<never> & {
  success: false;
  error: string;
};

export type ApiPaginatedResponse<T> = ApiSuccessResponse<PaginatedResult<T>>;
