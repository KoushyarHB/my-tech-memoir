"use client";

import type { Column } from "@tanstack/react-table";
import { Check, ChevronDown } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DataTableColumnFilterProps<TData, TValue> = {
  column: Column<TData, TValue>;
};

/** Kill every focus/highlight ring — muted chrome only. */
const noRing =
  "shadow-none! outline-none! ring-0! ring-offset-0 border-transparent focus:border-transparent focus:outline-none! focus:ring-0! focus-visible:border-transparent focus-visible:outline-none! focus-visible:ring-0! focus-visible:ring-offset-0 data-highlighted:outline-none! data-highlighted:ring-0! data-highlighted:shadow-none!";

const filterControlClass = cn(
  "h-7 w-full min-w-0 rounded-md border border-border/70 bg-transparent px-2.5 text-left text-[11px] text-ink-secondary placeholder:text-ink-tertiary/80 hover:border-border dark:bg-transparent",
  "shadow-none outline-none! ring-0 ring-offset-0 focus:outline-none! focus:ring-0 focus-visible:border-border focus-visible:outline-none! focus-visible:ring-0 focus-visible:ring-offset-0"
);

const menuItemClass = cn(
  "flex w-full cursor-default items-center gap-2 rounded-lg border border-transparent px-2.5 py-1.5 text-left text-xs select-none",
  "text-ink-secondary data-highlighted:bg-(--bg-muted) data-highlighted:text-ink-primary",
  "data-checked:bg-(--bg-muted) data-checked:font-medium data-checked:text-ink-primary",
  noRing
);

export function DataTableColumnFilter<TData, TValue>({
  column,
}: DataTableColumnFilterProps<TData, TValue>) {
  if (!column.getCanFilter()) {
    return null;
  }

  const meta = column.columnDef.meta;
  const variant = meta?.filterVariant ?? "text";
  const value = (column.getFilterValue() as string | undefined) ?? "";
  const title =
    typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : column.id;
  const placeholder = meta?.filterPlaceholder ?? `Search ${title}`;

  if (variant === "select") {
    const options = meta?.filterOptions ?? [];
    const selectedLabel =
      options.find((o) => o.value === value)?.label ?? "All";

    return (
      <Menu.Root>
        <Menu.Trigger
          className={cn(
            filterControlClass,
            "inline-flex items-center justify-between gap-1.5 data-popup-open:border-border"
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="size-3 shrink-0 opacity-50" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            className="isolate z-50 outline-none"
          >
            <Menu.Popup
              className={cn(
                "min-w-40 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-(--bg-elevated) p-1 text-ink-primary shadow-(--shadow-md)",
                "outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
                "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
              )}
              style={{ outline: "none" }}
            >
              <Menu.RadioGroup
                value={value || "__all__"}
                onValueChange={(next) => {
                  if (typeof next !== "string" || next === "__all__") {
                    column.setFilterValue(undefined);
                    return;
                  }
                  column.setFilterValue(next);
                }}
              >
                <Menu.RadioItem
                  value="__all__"
                  closeOnClick
                  label="All"
                  className={menuItemClass}
                  style={{ outline: "none", boxShadow: "none" }}
                >
                  <span className="flex-1">All</span>
                  <Menu.RadioItemIndicator className="flex size-3.5 items-center justify-center text-ink-tertiary">
                    <Check className="size-3.5" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
                {options.map((option) => (
                  <Menu.RadioItem
                    key={option.value}
                    value={option.value}
                    closeOnClick
                    label={option.label}
                    className={menuItemClass}
                    style={{ outline: "none", boxShadow: "none" }}
                  >
                    <span className="flex-1">{option.label}</span>
                    <Menu.RadioItemIndicator className="flex size-3.5 items-center justify-center text-ink-tertiary">
                      <Check className="size-3.5" />
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
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
      className={filterControlClass}
    />
  );
}
