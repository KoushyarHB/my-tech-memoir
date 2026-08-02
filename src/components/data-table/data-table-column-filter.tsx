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

const filterControlClass =
  "h-7 w-full min-w-0 rounded-md border border-border/70 bg-transparent px-2 text-[11px] text-ink-secondary shadow-none placeholder:text-ink-tertiary/80 hover:border-border focus-visible:border-border focus-visible:ring-1 focus-visible:ring-border/40 dark:bg-transparent";

const selectItemClass =
  "rounded-md text-xs text-ink-secondary focus:bg-(--bg-muted) focus:text-ink-primary data-highlighted:bg-(--bg-muted) data-highlighted:text-ink-primary";

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
  const placeholder = meta?.filterPlaceholder ?? `Search ${title}`;

  if (variant === "select") {
    const options = meta?.filterOptions ?? [];
    const ALL = "__all__";

    return (
      <div
        className={cn(
          "w-full min-w-0",
          align === "right" && "flex justify-end",
          align === "center" && "flex justify-center"
        )}
      >
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
              filterControlClass,
              "justify-between [&_svg]:size-3 [&_svg]:opacity-50"
            )}
          >
            <SelectValue>
              {value
                ? (options.find((o) => o.value === value)?.label ?? value)
                : "All"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            align="start"
            side="bottom"
            sideOffset={6}
            alignItemWithTrigger={false}
            className="z-100 min-w-40 border-border bg-(--bg-elevated) p-1 text-ink-primary shadow-(--shadow-lg) ring-1 ring-border/60"
          >
            <SelectItem value={ALL} className={selectItemClass}>
              All
            </SelectItem>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={selectItemClass}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full min-w-0",
        align === "right" && "flex justify-end",
        align === "center" && "flex justify-center"
      )}
    >
      <Input
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          column.setFilterValue(next || undefined);
        }}
        placeholder={placeholder}
        aria-label={`Filter ${column.id}`}
        className={cn(
          filterControlClass,
          align === "right" && "text-right"
        )}
      />
    </div>
  );
}
