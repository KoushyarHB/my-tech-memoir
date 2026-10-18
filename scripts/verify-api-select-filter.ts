import assert from "node:assert/strict";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { buildFilterExpression } from "../src/components/data-table/data-table-filters";
import { parseFilterExpression } from "../src/shared/lib/filter-expression";
import {
  buildFilterWhere,
  withFilters,
} from "../src/shared/lib/prisma-filter";
import {
  POST_FILTER_FIELDS,
  POST_FILTER_MAP,
} from "../src/features/blog/constants/post";
import type { DataTableColumnMeta } from "../src/components/data-table/types";

const metas: Record<string, DataTableColumnMeta> = {
  tags: {
    filterVariant: "api-select",
    filterEndpoint: "/api/tags",
    filterField: "tagId",
    filterOperator: "eq",
  },
  status: {
    filterVariant: "select",
    filterField: "published",
    filterOperator: "eq",
  },
  title: { filterField: "title", filterOperator: "contains" },
  tagsText: { filterVariant: "api-select", filterField: "tag" },
};

const getMeta = (id: string) => metas[id];

// api-select emits `field = "value"` (eq, quoted) — not CONTAINS.
const apiSelectFilters: ColumnFiltersState = [
  { id: "tags", value: "tag_abc123" },
];
assert.equal(
  buildFilterExpression(apiSelectFilters, getMeta),
  'tagId = "tag_abc123"'
);

// Default operator for api-select is eq even without an explicit operator.
assert.equal(
  buildFilterExpression([{ id: "tagsText", value: "react" }], getMeta),
  'tag = "react"'
);

// Unset filters are omitted entirely.
assert.equal(buildFilterExpression([{ id: "tags", value: "" }], getMeta), "");

// Combined with a text filter.
assert.equal(
  buildFilterExpression(
    [
      { id: "title", value: "react" },
      { id: "tags", value: "tag_abc123" },
    ],
    getMeta
  ),
  'title CONTAINS "react" AND tagId = "tag_abc123"'
);

// The server parses it against the posts allowlist into a relation filter.
const predicates = parseFilterExpression(
  buildFilterExpression(apiSelectFilters, getMeta),
  POST_FILTER_FIELDS
);
assert.deepEqual(predicates, [
  { field: "tagId", operator: "eq", value: "tag_abc123" },
]);

const where = withFilters({}, buildFilterWhere(predicates, POST_FILTER_MAP));
assert.deepEqual(where, {
  AND: [{}, { tags: { some: { tagId: { equals: "tag_abc123" } } } }],
});

// A value containing quotes is escaped, not broken out of.
assert.equal(
  buildFilterExpression([{ id: "tags", value: 'a"b' }], getMeta),
  'tagId = "a\\"b"'
);
assert.equal(
  parseFilterExpression('tagId = "a\\"b"', POST_FILTER_FIELDS)[0].value,
  'a"b'
);

console.log("api-select filter verification passed");
