import type { RowData } from "@tanstack/react-table";

export type DataTableFilterOption = {
  label: string;
  value: string;
};

export type DataTableColumnMeta = {
  align?: "left" | "right" | "center";
  filterVariant?: "text" | "select";
  filterOptions?: DataTableFilterOption[];
  filterPlaceholder?: string;
};

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue>
    extends DataTableColumnMeta {}
}
