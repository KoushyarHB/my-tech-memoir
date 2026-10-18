"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Column } from "@tanstack/react-table";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  API_SELECT_PAGE_SIZE,
  useApiSelectOptions,
  type ApiSelectOption,
} from "./use-api-select-options";

/** Kill every focus/highlight ring — matches the other filter controls. */
const noRing =
  "shadow-none! outline-none! ring-0! ring-offset-0 border-transparent focus:border-transparent focus:outline-none! focus:ring-0! focus-visible:border-transparent focus-visible:outline-none! focus-visible:ring-0! focus-visible:ring-offset-0 data-highlighted:outline-none! data-highlighted:ring-0! data-highlighted:shadow-none!";

const filterControlClass = cn(
  "h-7 w-full min-w-0 rounded-md border border-border bg-transparent px-2.5 text-left text-[11px] text-ink-secondary placeholder:text-ink-tertiary/80 hover:border-(--border-hover) dark:border-(--border-hover) dark:bg-transparent dark:hover:border-(--border-focus)",
  "shadow-none outline-none! ring-0 ring-offset-0 focus:outline-none! focus:ring-0 focus-visible:border-(--border-hover) focus-visible:outline-none! focus-visible:ring-0 focus-visible:ring-offset-0 dark:focus-visible:border-(--border-focus)"
);

const SEARCH_DEBOUNCE_MS = 300;

type DataTableApiSelectFilterProps<TData, TValue> = {
  column: Column<TData, TValue>;
  endpoint: string;
  placeholder?: string;
};

/**
 * Searchable, server-backed column filter.
 *
 * Matches tms-frontend's `ApiSelectFilter`: options come from a paginated
 * endpoint (`?page&pageSize&search`), search is debounced, and more pages load
 * as the list is scrolled. The selected option's **id** is stored as the filter
 * value so the filter expression stays a plain scalar.
 *
 * The displayed label is derived, never mirrored: `filterValue` is the single
 * source of truth, so an external "Clear filters" resets the control for free.
 */
export function DataTableApiSelectFilter<TData, TValue>({
  column,
  endpoint,
  placeholder,
}: DataTableApiSelectFilterProps<TData, TValue>) {
  const [open, setOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  /** Label of the option the user picked, kept across cache eviction. */
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const filterValue = column.getFilterValue() as string | undefined;
  const hasFilter = Boolean(filterValue);

  // A value with no known label means the filter was set externally, so the
  // option list is needed (even while closed) to display its name.
  const needsLabel = hasFilter && !pickedLabel;

  const {
    data,
    isPending,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useApiSelectOptions(endpoint, search, open || needsLabel);

  const options = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(
      () => setSearch(searchDraft.trim()),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [searchDraft]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reopen unfiltered next time.
      setSearchDraft("");
      setSearch("");
    }
  }

  function selectOption(option: ApiSelectOption) {
    setPickedLabel(option.label);
    column.setFilterValue(option.value);
    handleOpenChange(false);
  }

  function clear() {
    setPickedLabel(null);
    column.setFilterValue(undefined);
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const nearBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 24;
    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }

  const resolvedLabel = hasFilter
    ? (pickedLabel ??
      options.find((option) => option.value === filterValue)?.label ??
      "Loading…")
    : (placeholder ?? "All");

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        aria-label={placeholder ?? "Filter"}
        className={cn(
          filterControlClass,
          "inline-flex items-center gap-1.5 pr-2",
          hasFilter && "text-ink-primary",
          "data-popup-open:border-(--border-hover) dark:data-popup-open:border-(--border-focus)"
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">{resolvedLabel}</span>

        {/*
          Inline between the label and the chevron, matching tms-frontend's
          ApiSelectFilter layout ([label] [×] [⌄]). It is a span rather than a
          nested <button> because it lives inside the trigger, which is itself a
          button; `tabIndex={-1}` keeps it out of the tab order (keyboard users
          clear via the "All" option in the listbox).
        */}
        {hasFilter ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear filter"
            title="Clear filter"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              clear();
            }}
            className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-(--bg-muted) hover:text-ink-primary"
          >
            <X className="size-3" strokeWidth={2} />
          </span>
        ) : null}

        <ChevronDown className="size-3 shrink-0 opacity-50" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className="isolate z-50 outline-none"
        >
          <Popover.Popup
            className={cn(
              "w-(--anchor-width) min-w-44 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-(--bg-elevated) p-1 text-ink-primary shadow-(--shadow-md)",
              "outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
            style={{ outline: "none" }}
          >
            <div className="relative mb-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-ink-tertiary"
                aria-hidden
              />
              <Input
                autoFocus
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    handleOpenChange(false);
                  }
                }}
                placeholder="Search…"
                aria-label="Search options"
                className="h-7 rounded-md border-border bg-transparent pr-2 pl-7 text-[11px] shadow-none outline-none placeholder:text-ink-tertiary/80 focus-visible:border-(--border-hover) focus-visible:ring-0"
              />
            </div>

            <div
              ref={listRef}
              onScroll={handleScroll}
              role="listbox"
              aria-label={placeholder ?? "Options"}
              className="max-h-52 overflow-y-auto"
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-1.5 px-2 py-3 text-[11px] text-ink-tertiary">
                  <Loader2 className="size-3 animate-spin" />
                  Loading…
                </div>
              ) : isError ? (
                <p className="px-2 py-3 text-center text-[11px] text-destructive">
                  Could not load options
                </p>
              ) : options.length === 0 ? (
                <p className="px-2 py-3 text-center text-[11px] text-ink-tertiary">
                  No results
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    role="option"
                    aria-selected={!hasFilter}
                    onClick={clear}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] select-none",
                      "text-ink-tertiary hover:bg-(--bg-muted) hover:text-ink-primary",
                      noRing
                    )}
                  >
                    <span className="flex-1">All</span>
                    {!hasFilter ? <Check className="size-3" /> : null}
                  </button>

                  {options.map((option) => {
                    const isSelected = option.value === filterValue;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectOption(option)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] select-none",
                          "text-ink-secondary hover:bg-(--bg-muted) hover:text-ink-primary",
                          isSelected &&
                            "bg-(--bg-muted) font-medium text-ink-primary",
                          noRing
                        )}
                      >
                        <span className="flex-1 truncate">{option.label}</span>
                        {isSelected ? <Check className="size-3 shrink-0" /> : null}
                      </button>
                    );
                  })}

                  {isFetchingNextPage ? (
                    <div className="flex items-center justify-center py-2 text-ink-tertiary">
                      <Loader2 className="size-3 animate-spin" />
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {data && options.length >= API_SELECT_PAGE_SIZE ? (
              <p className="mt-1 border-t border-border px-2 pt-1 text-[10px] text-ink-tertiary">
                {options.length} of {data.pages[0].totalItems} shown
              </p>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
