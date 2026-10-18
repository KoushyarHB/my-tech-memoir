import type { RowData } from "@tanstack/react-table";
import type { FilterOperator } from "@/shared/lib/filter-expression";

export type DataTableFilterOption = {
  label: string;
  value: string;
};

export type DataTableColumnMeta = {
  align?: "left" | "right" | "center";
  /**
   * - `text` — free-text input (default)
   * - `select` — fixed option list from `filterOptions`
   * - `api-select` — searchable options fetched from `filterEndpoint`
   */
  filterVariant?: "text" | "select" | "api-select";
  filterOptions?: DataTableFilterOption[];
  filterPlaceholder?: string;
  /**
   * Server-side filter field name. Defaults to the column id and must be one of
   * the domain's `*_FILTER_FIELDS`.
   */
  filterField?: string;
  /** Defaults to `contains` for text, `eq` for select and api-select. */
  filterOperator?: FilterOperator;
  /**
   * Paginated list endpoint for `api-select`, e.g. `/api/tags`. The filter
   * requests `?page&pageSize&search` and reads `items[].id` / `items[].name`,
   * matching the tms-frontend `api-select` filter contract.
   */
  filterEndpoint?: string;
};

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue>
    extends DataTableColumnMeta {}
}
