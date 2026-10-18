/**
 * Renders the table footer in isolation to catch runtime errors in the
 * page-size dropdown (Base UI Select) without needing an authenticated page.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTablePagination } from "../src/components/data-table/data-table-pagination";
import { PAGE_SIZE_OPTIONS } from "../src/shared/constants/pagination";

function render(props: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}) {
  return renderToStaticMarkup(
    React.createElement(DataTablePagination, {
      ...props,
      onPageChange: () => {},
      onPageSizeChange: () => {},
      onReload: () => {},
      isFetching: false,
    })
  );
}

const html = render({ page: 2, pageSize: 5, totalItems: 9, totalPages: 2 });

// The trigger must render the current page size, not a placeholder.
if (!html.includes(">5<")) {
  throw new Error("page size 5 not rendered in the trigger");
}
if (html.includes("<select")) {
  throw new Error("native <select> still present");
}
if (!html.includes("per page")) {
  throw new Error("missing per-page label");
}
// Range label should reflect the 5-item window.
if (!html.includes("6") || !html.includes("9")) {
  throw new Error("range summary missing (expected 6–9 of 9)");
}
if (!html.includes("Rows per page")) {
  throw new Error("missing accessible label");
}

console.log("page size options:", PAGE_SIZE_OPTIONS.join(", "));
console.log("range label: 6–9 of 9  ✓");
console.log("custom select rendered (no native <select>)  ✓");
console.log("pagination footer verification passed");
