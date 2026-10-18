"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS } from "@/shared/constants/pagination";

type DataTablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onReload?: () => void;
  isFetching?: boolean;
  className?: string;
};

/** Window of page numbers around the current page (max 5 buttons). */
function getPageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.min(
    Math.max(page - 2, 1),
    Math.max(totalPages - 4, 1)
  );
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function DataTablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onReload,
  isFetching,
  className,
}: DataTablePaginationProps) {
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const pages = getPageWindow(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-xs tabular-nums text-ink-tertiary">
        {firstItem}–{lastItem} of {totalItems}
        {isFetching ? (
          <span className="ml-2 inline-block animate-pulse text-ink-tertiary/70">
            updating…
          </span>
        ) : null}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="First page"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-3.5" />
          </Button>

          {pages.map((candidate) => (
            <Button
              key={candidate}
              variant={candidate === page ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label={`Page ${candidate}`}
              aria-current={candidate === page ? "page" : undefined}
              className="tabular-nums"
              onClick={() => onPageChange(candidate)}
            >
              {candidate}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Last page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight className="size-3.5" />
          </Button>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-ink-tertiary">
          <span className="sr-only">Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-7 rounded-md border border-border bg-transparent px-1.5 text-xs text-ink-secondary outline-none hover:border-(--border-hover) focus-visible:border-(--border-focus)"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="hidden sm:inline">per page</span>
        </label>

        {onReload ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reload"
            onClick={onReload}
            disabled={isFetching}
          >
            <RotateCw className={cn("size-3.5", isFetching && "animate-spin")} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
