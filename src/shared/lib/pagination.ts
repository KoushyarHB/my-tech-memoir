import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  FILTERS_MAX_LENGTH,
  PAGINATION_MAX_PAGE_SIZE,
  PAGINATION_MIN_PAGE_SIZE,
  SEARCH_MAX_LENGTH,
} from "@/shared/constants/pagination";
import type {
  PaginatedResult,
  PaginationQuery,
  SortOrder,
} from "@/shared/types/pagination";
import {
  FilterExpressionError,
  parseFilterExpression,
  type FilterPredicate,
} from "./filter-expression";

/**
 * Shared kernel: request parsing and result shaping for paginated endpoints.
 *
 * Mirrors `PaginationRequest` / `PaginationResult` from tms-backend: the same
 * bounds (page >= 1, 1 <= pageSize <= 100) and the same response fields.
 */

export class QueryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueryValidationError";
  }
}

export type ParsePaginationOptions = {
  defaultPageSize?: number;
  maxPageSize?: number;
};

function readInt(
  value: string | null,
  fallback: number,
  label: string
): number {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new QueryValidationError(`${label} must be an integer`);
  }
  return parsed;
}

export function parsePaginationQuery(
  searchParams: URLSearchParams,
  options: ParsePaginationOptions = {}
): PaginationQuery {
  const defaultPageSize = options.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = options.maxPageSize ?? PAGINATION_MAX_PAGE_SIZE;

  const page = readInt(searchParams.get("page"), DEFAULT_PAGE, "page");
  const pageSize = readInt(
    searchParams.get("pageSize"),
    defaultPageSize,
    "pageSize"
  );

  if (page < 1) {
    throw new QueryValidationError("page must be greater than 0");
  }
  if (pageSize < PAGINATION_MIN_PAGE_SIZE || pageSize > maxPageSize) {
    throw new QueryValidationError(
      `pageSize must be between ${PAGINATION_MIN_PAGE_SIZE} and ${maxPageSize}`
    );
  }

  const search = (searchParams.get("search") ?? "").trim();
  if (search.length > SEARCH_MAX_LENGTH) {
    throw new QueryValidationError(
      `search must be ${SEARCH_MAX_LENGTH} characters or fewer`
    );
  }

  const filters = (searchParams.get("filters") ?? "").trim();
  if (filters.length > FILTERS_MAX_LENGTH) {
    throw new QueryValidationError(
      `filters must be ${FILTERS_MAX_LENGTH} characters or fewer`
    );
  }

  const sortOrderRaw = (searchParams.get("sortOrder") ?? "").trim().toLowerCase();
  if (sortOrderRaw && sortOrderRaw !== "asc" && sortOrderRaw !== "desc") {
    throw new QueryValidationError("sortOrder must be asc or desc");
  }

  const searchFields = (searchParams.get("searchFields") ?? "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  return {
    page,
    pageSize,
    search: search || null,
    filters: filters || null,
    sortBy: (searchParams.get("sortBy") ?? "").trim() || null,
    sortOrder: (sortOrderRaw as SortOrder) || null,
    searchFields: searchFields.length > 0 ? searchFields : null,
  };
}

export function getPaginationSkip(query: PaginationQuery): number {
  return (query.page - 1) * query.pageSize;
}

export function createPaginatedResult<T>(
  items: T[],
  totalItems: number,
  query: Pick<PaginationQuery, "page" | "pageSize">
): PaginatedResult<T> {
  return {
    page: query.page,
    pageSize: query.pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize),
    items,
  };
}

/** Parses `filters` against a domain allowlist, mapping errors to 400s. */
export function parseFilters(
  filters: string | null | undefined,
  allowedFields: readonly string[]
): FilterPredicate[] {
  try {
    return parseFilterExpression(filters, allowedFields);
  } catch (error) {
    if (error instanceof FilterExpressionError) {
      throw new QueryValidationError(error.message);
    }
    throw error;
  }
}
