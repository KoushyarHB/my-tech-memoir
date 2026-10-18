import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataTableApiSelectFilter } from "../src/components/data-table/data-table-api-select-filter";

/**
 * Renders the api-select filter closed, which exercises the trigger, the
 * placeholder and the clear-affordance layout without a browser.
 */
function render(placeholder: string | undefined, value: string | undefined) {
  const column = {
    getFilterValue: () => value,
    setFilterValue: () => {},
  } as unknown as Parameters<typeof DataTableApiSelectFilter>[0]["column"];

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(DataTableApiSelectFilter, {
        column,
        endpoint: "/api/tags",
        placeholder,
      })
    )
  );
}

/** The trigger's inner markup, so we can assert icon order. */
function triggerInner(html: string): string {
  const start = html.indexOf('aria-label="All tags"');
  if (start < 0) throw new Error("trigger not found");
  const open = html.indexOf(">", start) + 1;
  const close = html.indexOf("</button>", open);
  return html.slice(open, close);
}

const html = render("All tags", undefined);

if (!html.includes("All tags")) {
  throw new Error("placeholder not rendered");
}
if (html.includes("Clear filter")) {
  throw new Error("clear button should not render without a selection");
}

const selected = render("All tags", "tag_123");

// The clear affordance must be present once a filter is active...
if (!selected.includes("Clear filter")) {
  throw new Error("clear button missing when a value is selected");
}
if (!selected.includes("Loading…")) {
  throw new Error("unresolved label should not read as the placeholder");
}

// ...and it must sit INSIDE the trigger, before the chevron (tms layout:
// [label] [x] [chevron]) rather than floating over it.
const inner = triggerInner(selected);
const clearIndex = inner.indexOf("Clear filter");
const chevronIndex = inner.indexOf("lucide-chevron-down");

if (clearIndex < 0) {
  throw new Error("clear affordance is not inside the trigger");
}
if (chevronIndex < 0) {
  throw new Error("chevron is not inside the trigger");
}
if (clearIndex > chevronIndex) {
  throw new Error("clear affordance must come before the chevron");
}

// It must not be an absolutely-positioned overlay (the old bug).
if (/absolute[^"]*"[^>]*Clear filter|Clear filter[^>]*absolute/.test(inner)) {
  throw new Error("clear affordance should not be absolutely positioned");
}
if (inner.includes("absolute")) {
  throw new Error("trigger inner markup should not contain absolute positioning");
}

console.log("trigger placeholder + a11y label  ✓");
console.log("clear affordance only when a filter is active  ✓");
console.log("clear affordance inside trigger, before chevron  ✓");
console.log("api-select filter render verification passed");
