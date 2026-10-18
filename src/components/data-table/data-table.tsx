"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Search, X } from "lucide-react";
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
import { DataTableApiSelectFilter } from "./data-table-api-select-filter";
import { DataTablePagination } from "./data-table-pagination";
import { buildFilterExpression, hasActiveColumnFilters } from "./data-table-filters";
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

/** Debounce for the search box before it triggers a server round-trip. */
const SEARCH_DEBOUNCE_MS = 300;

export type DataTableQuery = {
  /** 1-based page number. */
  page: number;
  pageSize: number;
  search: string;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
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

  // ── Server-driven mode ───────────────────────────────────────────────
  /** When provided, pagination/sorting/filtering are delegated to the server. */
  query?: DataTableQuery;
  onQueryChange?: (patch: Partial<DataTableQuery>) => void;
  /**
   * Receives the `filters` expression derived from the column filters, using
   * each column's `filterField`/`filterOperator` meta. The parent passes it to
   * the API as the `filters` query parameter.
   */
  onFiltersChange?: (expression: string) => void;
  totalItems?: number;
  totalPages?: number;
  isFetching?: boolean;
  isLoading?: boolean;
  onReload?: () => void;
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
  query,
  onQueryChange,
  onFiltersChange,
  totalItems,
  totalPages,
  isFetching,
  isLoading,
  onReload,
}: DataTableProps<TData>) {
  "use no memo";

  const serverSide = Boolean(query && onQueryChange);

  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const [localColumnFilters, setLocalColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [localGlobalFilter, setLocalGlobalFilter] = useState("");
  const [searchDraft, setSearchDraft] = useState(query?.search ?? "");

  const sorting = serverSide ? (query?.sorting ?? []) : localSorting;
  const columnFilters = useMemo(
    () => (serverSide ? (query?.columnFilters ?? []) : localColumnFilters),
    [serverSide, query?.columnFilters, localColumnFilters]
  );
  const globalFilter = serverSide
    ? (query?.search ?? "")
    : localGlobalFilter;

  // Keep the input in sync when the query changes from outside (reset, reload).
  const lastExternalSearch = useRef(globalFilter);
  useEffect(() => {
    if (lastExternalSearch.current !== globalFilter) {
      lastExternalSearch.current = globalFilter;
      setSearchDraft(globalFilter);
    }
  }, [globalFilter]);

  // Debounced search → server. Resets to page 1 because result sets change.
  useEffect(() => {
    if (!serverSide || !onQueryChange) return;
    if (searchDraft === (query?.search ?? "")) return;

    const timer = setTimeout(() => {
      lastExternalSearch.current = searchDraft;
      onQueryChange({ search: searchDraft, page: 1 });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchDraft, serverSide, onQueryChange, query?.search]);

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
    manualPagination: serverSide,
    manualSorting: serverSide,
    manualFiltering: serverSide,
    pageCount: serverSide ? (totalPages ?? -1) : undefined,
    enableMultiSort: false,
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      if (serverSide && onQueryChange) {
        onQueryChange({ sorting: next, page: 1 });
        return;
      }
      setLocalSorting(next);
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(columnFilters) : updater;
      if (serverSide && onQueryChange) {
        onQueryChange({ columnFilters: next, page: 1 });
        return;
      }
      setLocalColumnFilters(next);
    },
    onGlobalFilterChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(globalFilter) : updater;
      if (serverSide) {
        setSearchDraft(String(next ?? ""));
        return;
      }
      setLocalGlobalFilter(String(next ?? ""));
    },
    globalFilterFn: globalFilterFn as FilterFn<TData>,
    getCoreRowModel: getCoreRowModel(),
    ...(serverSide
      ? {}
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
        }),
  });

  const rows = table.getRowModel().rows;
  const hasActiveFilters =
    globalFilter.trim().length > 0 || hasActiveColumnFilters(columnFilters);

  // Derive the server `filters` expression from the column filters + meta.
  const filterExpression = useMemo(
    () =>
      buildFilterExpression(
        columnFilters,
        (columnId) => table.getColumn(columnId)?.columnDef.meta
      ),
    [columnFilters, table]
  );

  const lastFiltersRef = useRef("");
  useEffect(() => {
    if (!serverSide || !onFiltersChange) return;
    if (lastFiltersRef.current === filterExpression) return;
    lastFiltersRef.current = filterExpression;
    onFiltersChange(filterExpression);
  }, [filterExpression, serverSide, onFiltersChange]);

  const toolbarContent =
    typeof toolbar === "function"
      ? toolbar({
          rows: rows.map((row) => row.original),
          filteredCount: rows.length,
          totalCount: totalItems ?? data.length,
        })
      : toolbar;

  const countLabel = useMemo(() => {
    if (serverSide) {
      const total = totalItems ?? 0;
      return `${total} ${total === 1 ? "entry" : "entries"}`;
    }
    const visible = rows.length;
    const total = data.length;
    if (hasActiveFilters) {
      return `${visible} of ${total} matching`;
    }
    return `${total} ${total === 1 ? "entry" : "entries"}`;
  }, [serverSide, totalItems, rows.length, data.length, hasActiveFilters]);

  function clearFilters() {
    setSearchDraft("");
    if (serverSide && onQueryChange) {
      onQueryChange({ search: "", columnFilters: [], page: 1 });
      return;
    }
    setLocalGlobalFilter("");
    setLocalColumnFilters([]);
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
            type="text"
            value={serverSide ? searchDraft : globalFilter}
            onChange={(e) =>
              serverSide
                ? setSearchDraft(e.target.value)
                : setLocalGlobalFilter(e.target.value)
            }
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
            className="h-8 border-border bg-transparent pr-8 pl-8 text-xs shadow-none outline-none placeholder:text-ink-tertiary/80 focus-visible:border-(--border-hover) focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-(--border-hover) dark:bg-transparent dark:focus-visible:border-(--border-focus)"
          />
          {(serverSide ? searchDraft : globalFilter).trim().length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                if (serverSide && onQueryChange) {
                  onQueryChange({ search: "", page: 1 });
                  return;
                }
                setLocalGlobalFilter("");
              }}
              className="absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-(--bg-muted) hover:text-ink-primary"
              aria-label="Clear search"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          ) : null}
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
                      "h-auto px-3 py-2",
                      align === "right" && "text-right"
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
                    {header.column.getCanFilter() &&
                    header.column.columnDef.meta?.filterVariant ===
                      "api-select" &&
                    header.column.columnDef.meta.filterEndpoint ? (
                      <DataTableApiSelectFilter
                        column={header.column}
                        endpoint={
                          header.column.columnDef.meta.filterEndpoint
                        }
                        placeholder={
                          header.column.columnDef.meta.filterPlaceholder
                        }
                      />
                    ) : (
                      <DataTableColumnFilter column={header.column} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading && rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={Math.max(columns.length, 1)}
                className="h-28 px-5 py-10 text-center"
              >
                <p className="text-sm text-ink-tertiary">Loading…</p>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
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

      {serverSide && query && onQueryChange ? (
        <DataTablePagination
          page={query.page}
          pageSize={query.pageSize}
          totalItems={totalItems ?? 0}
          totalPages={totalPages ?? 0}
          onPageChange={(page) => onQueryChange({ page })}
          onPageSizeChange={(pageSize) => onQueryChange({ pageSize, page: 1 })}
          onReload={onReload}
          isFetching={isFetching}
        />
      ) : null}
    </section>
  );
}
