"use client";

import type { Column } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DataTableColumnFilterProps<TData, TValue> = {
  column: Column<TData, TValue>;
};

export function DataTableColumnFilter<TData, TValue>({
  column,
}: DataTableColumnFilterProps<TData, TValue>) {
  if (!column.getCanFilter()) {
    return <div className="h-7" aria-hidden />;
  }

  const meta = column.columnDef.meta;
  const variant = meta?.filterVariant ?? "text";
  const value = (column.getFilterValue() as string | undefined) ?? "";
  const align = meta?.align ?? "left";
  const title =
    typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : column.id;
  const placeholder =
    meta?.filterPlaceholder ?? `Search ${title}`;

  if (variant === "select") {
    const options = meta?.filterOptions ?? [];
    const ALL = "__all__";

    return (
      <div className="w-full min-w-0">
        <Select
          value={value || ALL}
          onValueChange={(next) => {
            if (!next || next === ALL) {
              column.setFilterValue(undefined);
              return;
            }
            column.setFilterValue(next);
          }}
        >
          <SelectTrigger
            size="sm"
            className={cn(
              "h-7 w-full min-w-0 max-w-full justify-between border-border bg-(--bg-base) text-xs [&_svg]:size-3.5",
              align === "right" && "flex-row-reverse"
            )}
          >
            <SelectValue>
              {value
                ? (options.find((o) => o.value === value)?.label ?? value)
                : "All"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start" className="min-w-36">
            <SelectItem value={ALL}>All</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        column.setFilterValue(next || undefined);
      }}
      placeholder={placeholder}
      aria-label={`Filter ${column.id}`}
      className={cn(
        "h-7 w-full min-w-0 border-border bg-(--bg-base) px-2 text-xs dark:bg-(--bg-base)",
        align === "right" && "text-right"
      )}
    />
  );
}
