import { api } from "@/lib/api-client";
import { toPaginationQueryString } from "@/shared/lib/query-string";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import type { CreateTagRequest, GetTagDto, GetTagStatsDto } from "../types";

/**
 * Tags domain: client-side API functions.
 *
 * Mirrors tms-frontend's `services/<domain>/<entity>Service.ts`: one function
 * per endpoint, typed DTO in and out, no React.
 */

export async function fetchTagsPage(
  query: Partial<PaginationQuery> = {}
): Promise<PaginatedResult<GetTagDto>> {
  return api.get<PaginatedResult<GetTagDto>>(
    `/api/tags${toPaginationQueryString(query)}`
  );
}

export async function createTag(input: CreateTagRequest): Promise<GetTagDto> {
  return api.post<GetTagDto>("/api/tags", input);
}

export async function fetchTagStats(): Promise<GetTagStatsDto> {
  return api.get<GetTagStatsDto>("/api/tags/stats");
}
