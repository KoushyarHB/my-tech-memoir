import { NextResponse } from "next/server";

interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: ApiResponseMeta;
}

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

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  options?: ResponseOptions
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      status: options?.status ?? 200,
      headers: options?.headers,
    }
  );
}
