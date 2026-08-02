"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const align = column.columnDef.meta?.align ?? "left";
  const sorted = column.getIsSorted();
  const canSort = column.getCanSort();

  if (!canSort) {
    return (
      <span
        className={cn(
          "inline-flex w-full text-[11px] font-medium uppercase tracking-[0.1em] text-ink-tertiary",
          align === "right" && "justify-end",
          align === "center" && "justify-center",
          className
        )}
      >
        {title}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "inline-flex w-full items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors hover:text-ink-primary",
        align === "right" && "justify-end",
        align === "center" && "justify-center",
        sorted ? "text-ink-primary" : "text-ink-tertiary",
        className
      )}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUp className="size-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3" />
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
}
