import type { SortOrder } from "@/shared/types/pagination";

/**
 * Shared kernel: sort resolution.
 *
 * tms-backend's `sanitizeMeiliSort` drops sort fields the index does not know
 * and falls back to a default rather than failing the request. We do the same
 * so a stale bookmark or an old client cannot break a list page.
 */

export type ResolvedSort<TField extends string> = {
  field: TField;
  order: SortOrder;
};

export function resolveSort<TField extends string>(input: {
  sortBy?: string | null;
  sortOrder?: SortOrder | null;
  allowedFields: readonly TField[];
  defaultField: TField;
  defaultOrder?: SortOrder;
}): ResolvedSort<TField> {
  const {
    sortBy,
    sortOrder,
    allowedFields,
    defaultField,
    defaultOrder = "desc",
  } = input;

  const candidate = (sortBy ?? "").trim() as TField;
  const field = allowedFields.includes(candidate) ? candidate : defaultField;

  return {
    field,
    order: sortOrder ?? defaultOrder,
  };
}
