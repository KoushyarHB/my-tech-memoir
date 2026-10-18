import type { ColumnFiltersState } from "@tanstack/react-table";
import type { FilterOperator } from "@/shared/lib/filter-expression";
import type { DataTableColumnMeta } from "./types";

/**
 * Translates the table's column filters into the `filters` expression the API
 * expects — the same job tms-frontend's `GenericTable.buildApiUrl` does.
 *
 * Only values the user actually set are emitted, and every value is quoted so
 * the server-side parser can bind it safely.
 */

const OPERATOR_TOKEN: Record<FilterOperator, string> = {
  eq: "=",
  neq: "!=",
  contains: "CONTAINS",
  startsWith: "STARTS WITH",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  in: "IN",
  isNull: "IS NULL",
  isNotNull: "IS NOT NULL",
};

function quote(value: unknown): string {
  const text = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${text}"`;
}

function isBlank(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

export function buildFilterExpression(
  columnFilters: ColumnFiltersState,
  getMeta: (columnId: string) => DataTableColumnMeta | undefined
): string {
  return columnFilters
    .filter((filter) => !isBlank(filter.value))
    .map((filter) => {
      const meta = getMeta(filter.id);
      const field = meta?.filterField ?? filter.id;
      const variant = meta?.filterVariant ?? "text";
      const operator =
        meta?.filterOperator ??
        (variant === "text" ? "contains" : "eq");

      if (operator === "isNull" || operator === "isNotNull") {
        return `${field} ${OPERATOR_TOKEN[operator]}`;
      }

      return `${field} ${OPERATOR_TOKEN[operator]} ${quote(filter.value)}`;
    })
    .join(" AND ");
}

/** True when any filter is set — used for the "clear filters" affordance. */
export function hasActiveColumnFilters(
  columnFilters: ColumnFiltersState
): boolean {
  return columnFilters.some((filter) => !isBlank(filter.value));
}
