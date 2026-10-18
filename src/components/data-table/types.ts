import type { RowData } from "@tanstack/react-table";
import type { FilterOperator } from "@/shared/lib/filter-expression";

export type DataTableFilterOption = {
  label: string;
  value: string;
};

export type DataTableColumnMeta = {
  align?: "left" | "right" | "center";
  filterVariant?: "text" | "select";
  filterOptions?: DataTableFilterOption[];
  filterPlaceholder?: string;
  /**
   * Server-side filter field name. Defaults to the column id and must be one of
   * the domain's `*_FILTER_FIELDS`.
   */
  filterField?: string;
  /** Defaults to `contains` for text filters and `eq` for selects. */
  filterOperator?: FilterOperator;
};

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue>
    extends DataTableColumnMeta {}
}
