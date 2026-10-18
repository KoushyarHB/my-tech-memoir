import assert from "node:assert/strict";
import {
  parsePaginationQuery,
  QueryValidationError,
  createPaginatedResult,
} from "../src/shared/lib/pagination";
import { parseFilterExpression } from "../src/shared/lib/filter-expression";
import {
  buildFilterWhere,
  buildSearchWhere,
  withFilters,
} from "../src/shared/lib/prisma-filter";
import { POST_FILTER_MAP, POST_FILTER_FIELDS } from "../src/features/blog/constants/post";

function expectThrow(fn: () => unknown, label: string) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`Expected throw: ${label}`);
}

// ── pagination defaults + validation ─────────────────────────────────
const defaults = parsePaginationQuery(new URLSearchParams());
assert.equal(defaults.page, 1);
assert.equal(defaults.pageSize, 20);
assert.equal(defaults.search, null);

const explicit = parsePaginationQuery(
  new URLSearchParams("page=3&pageSize=50&search=hello&sortBy=title&sortOrder=asc")
);
assert.equal(explicit.page, 3);
assert.equal(explicit.pageSize, 50);
assert.equal(explicit.search, "hello");
assert.equal(explicit.sortBy, "title");
assert.equal(explicit.sortOrder, "asc");

expectThrow(
  () => parsePaginationQuery(new URLSearchParams("page=0")),
  "page 0"
);
expectThrow(
  () => parsePaginationQuery(new URLSearchParams("pageSize=101")),
  "pageSize 101"
);
expectThrow(
  () => parsePaginationQuery(new URLSearchParams("pageSize=0")),
  "pageSize 0"
);
expectThrow(
  () => parsePaginationQuery(new URLSearchParams("sortOrder=sideways")),
  "bad sortOrder"
);

const result = createPaginatedResult([1, 2], 42, { page: 2, pageSize: 20 });
assert.deepEqual(result, {
  page: 2,
  pageSize: 20,
  totalItems: 42,
  totalPages: 3,
  items: [1, 2],
});
assert.equal(createPaginatedResult([], 0, { page: 1, pageSize: 20 }).totalPages, 0);

// ── filter parsing ───────────────────────────────────────────────────
const parsed = parseFilterExpression(
  'published = "true" AND title CONTAINS "react" AND viewCount >= 10'
);
assert.equal(parsed.length, 3);
assert.deepEqual(parsed[0], { field: "published", operator: "eq", value: "true" });
assert.deepEqual(parsed[1], { field: "title", operator: "contains", value: "react" });
assert.deepEqual(parsed[2], { field: "viewCount", operator: "gte", value: 10 });

const isNull = parseFilterExpression("excerpt IS NULL");
assert.deepEqual(isNull[0], { field: "excerpt", operator: "isNull" });

const inList = parseFilterExpression('tag IN ["react", "next"]');
assert.deepEqual(inList[0], { field: "tag", operator: "in", value: ["react", "next"] });

// A value containing an operator word must not confuse the parser.
const tricky = parseFilterExpression('title = "CONTAINS"');
assert.deepEqual(tricky[0], { field: "title", operator: "eq", value: "CONTAINS" });

// Parenthesised whole clause unwraps.
const parens = parseFilterExpression('(published = "true")');
assert.equal(parens.length, 1);

// Allowlist rejects unknown fields.
expectThrow(
  () => parseFilterExpression("hacker = 1", POST_FILTER_FIELDS),
  "unknown field"
);

// ── prisma where building ────────────────────────────────────────────
const predicates = parseFilterExpression(
  'published = "true" AND title CONTAINS "react"',
  POST_FILTER_FIELDS
);
const fragments = buildFilterWhere(predicates, POST_FILTER_MAP);
assert.deepEqual(fragments[0], { published: { equals: true } });
assert.deepEqual(fragments[1], {
  title: { contains: "react", mode: "insensitive" },
});

// Relation-backed filter → some {}
const tagPredicates = parseFilterExpression('tag = "react"', POST_FILTER_FIELDS);
const tagWhere = buildFilterWhere(tagPredicates, POST_FILTER_MAP);
assert.deepEqual(tagWhere[0], {
  tags: { some: { tag: { slug: { equals: "react", mode: "insensitive" } } } },
});

const combined = withFilters({ published: true }, fragments);
assert.equal(Array.isArray((combined as { AND: unknown[] }).AND), true);

// Enum fields must not receive `mode` — Prisma rejects it on enums.
const enumWhere = buildFilterWhere(
  parseFilterExpression('role = "ADMIN"'),
  { role: { path: "role", type: "enum" } }
);
assert.deepEqual(enumWhere[0], { role: { equals: "ADMIN" } });

const enumIn = buildFilterWhere(
  parseFilterExpression('role IN ["ADMIN", "EDITOR"]'),
  { role: { path: "role", type: "enum" } }
);
assert.deepEqual(enumIn[0], { role: { in: ["ADMIN", "EDITOR"] } });

const search = buildSearchWhere("react", ["title", "slug"]);
assert.deepEqual(search, {
  OR: [
    { title: { contains: "react", mode: "insensitive" } },
    { slug: { contains: "react", mode: "insensitive" } },
  ],
});
assert.equal(buildSearchWhere("   ", ["title"]), null);

// Validation errors are QueryValidationError so routes can answer 400.
try {
  buildFilterWhere(
    parseFilterExpression("viewCount CONTAINS 5", POST_FILTER_FIELDS),
    POST_FILTER_MAP
  );
  throw new Error("expected CONTAINS on number to fail");
} catch (error) {
  assert.ok(error instanceof QueryValidationError);
}

console.log("query layer verification passed");
