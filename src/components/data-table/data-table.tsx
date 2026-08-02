"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTableColumnFilter } from "./data-table-column-filter";
import "./types";

const globalFilterFn = <TData,>(
  row: {
    getAllCells: () => Array<{ getValue: () => unknown }>;
  },
  _columnId: string,
  filterValue: unknown
): boolean => {
  const query = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!query) return true;

  const values = row.getAllCells().map((cell) => {
    const value = cell.getValue();
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return String(item);
          }
          if (item && typeof item === "object" && "name" in item) {
            return String((item as { name: unknown }).name ?? "");
          }
          return "";
        })
        .join(" ");
    }
    return "";
  });

  return values.join(" ").toLowerCase().includes(query);
};

type DataTableToolbarContext<TData> = {
  rows: TData[];
  filteredCount: number;
  totalCount: number;
};

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  toolbar?:
  | React.ReactNode
  | ((ctx: DataTableToolbarContext<TData>) => React.ReactNode);
  title?: string;
  description?: string;
  emptyMessage?: string;
  emptyFilteredMessage?: string;
  className?: string;
};

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  searchPlaceholder = "Search…",
  searchAriaLabel = "Search table",
  toolbar,
  title,
  description,
  emptyMessage = "No results",
  emptyFilteredMessage = "No results match your filters",
  className,
}: DataTableProps<TData>) {
  "use no memo";

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is not React Compiler–safe yet
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn as FilterFn<TData>,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const hasActiveFilters =
    globalFilter.trim().length > 0 || columnFilters.length > 0;

  const toolbarContent =
    typeof toolbar === "function"
      ? toolbar({
        rows: rows.map((row) => row.original),
        filteredCount: rows.length,
        totalCount: data.length,
      })
      : toolbar;

  const countLabel = useMemo(() => {
    const visible = rows.length;
    const total = data.length;
    if (hasActiveFilters) {
      return `${visible} of ${total} matching`;
    }
    return `${total} ${total === 1 ? "entry" : "entries"}`;
  }, [rows.length, data.length, hasActiveFilters]);

  function clearFilters() {
    setGlobalFilter("");
    setColumnFilters([]);
  }

  const showHeaderChrome = Boolean(title || description || toolbarContent);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-(--bg-elevated)",
        className
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-3.5">
        {showHeaderChrome ? (
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title ? (
                <h2 className="text-sm font-medium text-ink-primary">{title}</h2>
              ) : null}
              <p className="text-xs text-ink-tertiary">
                {description ? `${description} · ` : null}
                {countLabel}
              </p>
            </div>
            {toolbarContent ? (
              <div className="shrink-0">{toolbarContent}</div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-ink-tertiary">{countLabel}</p>
        )}

        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
            className="h-8 border-border/70 bg-transparent pl-8 text-xs shadow-none outline-none placeholder:text-ink-tertiary/80 focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
          />
        </div>
      </div>

      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={`${headerGroup.id}-labels`}
              className="border-border hover:bg-transparent has-aria-expanded:bg-transparent"
            >
              {headerGroup.headers.map((header) => {
                const align = header.column.columnDef.meta?.align ?? "left";
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-auto px-3 pt-4 pb-1.5",
                      align === "right" && "text-right",
                      align === "center" && "text-center"
                    )}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={`${headerGroup.id}-filters`}
              className="border-b border-border bg-transparent hover:bg-transparent has-aria-expanded:bg-transparent"
            >
              {headerGroup.headers.map((header) => {
                const align = header.column.columnDef.meta?.align ?? "left";
                return (
                  <TableHead
                    key={`${header.id}-filter`}
                    className={cn(
                      "h-auto px-3 py-2 align-top font-normal",
                      align === "right" && "text-right",
                      align === "center" && "text-center"
                    )}
                  >
                    <DataTableColumnFilter column={header.column} />
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={Math.max(columns.length, 1)}
                className="h-28 px-5 py-10 text-center"
              >
                <p className="text-sm text-ink-primary">
                  {hasActiveFilters ? emptyFilteredMessage : emptyMessage}
                </p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-2 text-xs text-ink-secondary underline-offset-2 hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-border/80 hover:bg-(--bg-muted)/50"
              >
                {row.getVisibleCells().map((cell) => {
                  const align = cell.column.columnDef.meta?.align ?? "left";
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-3 py-3",
                        align === "right" && "text-right",
                        align === "center" && "text-center"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}
