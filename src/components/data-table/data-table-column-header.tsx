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

  const base = cn(
    "inline-flex w-full items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase transition-colors",
    align === "right" && "justify-end",
    align === "center" && "justify-center",
    className
  );

  if (!canSort) {
    return (
      <span className={cn(base, "text-ink-secondary")}>{title}</span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        base,
        "hover:text-ink-primary",
        sorted ? "text-ink-primary" : "text-ink-secondary"
      )}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5 shrink-0" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5 shrink-0" />
      ) : (
        <ArrowUpDown className="size-3.5 shrink-0 opacity-35" />
      )}
    </button>
  );
}
