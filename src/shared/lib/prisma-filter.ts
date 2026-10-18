import { QueryValidationError } from "./pagination";
import type { FilterPredicate, FilterValue } from "./filter-expression";

/**
 * Shared kernel: translate validated filter predicates into Prisma `where`
 * fragments.
 *
 * Each domain declares a field map; anything not in the map is rejected before
 * it reaches here (see `parseFilters`). Values are always bound through Prisma
 * parameters, never interpolated into a query string.
 */

export type FilterFieldType = "string" | "enum" | "number" | "boolean" | "date";

export type FilterFieldDescriptor = {
  /** Scalar path on the model, one level of to-one nesting allowed (`user.name`). */
  path: string;
  type: FilterFieldType;
  /**
   * Name of a to-many relation the field lives behind, e.g. `tags` for a post
   * filtered by `tag.slug`. Rendered as `{ tags: { some: ... } }`.
   */
  relation?: string;
};

export type FilterFieldMap = Record<string, FilterFieldDescriptor>;

type PrismaWhere = Record<string, unknown>;

function coerce(
  value: FilterValue,
  type: FilterFieldType,
  field: string
): unknown {
  if (type === "string" || type === "enum") {
    if (Array.isArray(value)) return value.map(String);
    return String(value);
  }
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new QueryValidationError(`${field} must be true or false`);
  }
  if (type === "number") {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      throw new QueryValidationError(`${field} must be a number`);
    }
    return parsed;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new QueryValidationError(`${field} must be a valid date`);
  }
  return date;
}

/** `["a", "b"]` + leaf → `{ a: { b: leaf } }` */
function nest(path: string, leaf: PrismaWhere): PrismaWhere {
  const segments = path.split(".");
  return segments.reduceRight<PrismaWhere>(
    (inner, segment) => ({ [segment]: inner }),
    leaf
  );
}

function buildLeaf(
  descriptor: FilterFieldDescriptor,
  predicate: FilterPredicate
): PrismaWhere {
  const { type, path } = descriptor;
  const label = predicate.field;

  switch (predicate.operator) {
    case "isNull":
      return nest(path, { equals: null });
    case "isNotNull":
      return nest(path, { not: null });
    case "eq": {
      const value = coerce(predicate.value ?? null, type, label);
      return nest(
        path,
        type === "string"
          ? { equals: value, mode: "insensitive" }
          : { equals: value }
      );
    }
    case "neq": {
      const value = coerce(predicate.value ?? null, type, label);
      return nest(
        path,
        type === "string"
          ? { not: { equals: value, mode: "insensitive" } }
          : { not: { equals: value } }
      );
    }
    case "contains": {
      if (type !== "string") {
        throw new QueryValidationError(
          `CONTAINS is only supported on text fields (${label})`
        );
      }
      return nest(path, {
        contains: coerce(predicate.value ?? null, "string", label),
        mode: "insensitive",
      });
    }
    case "startsWith": {
      if (type !== "string") {
        throw new QueryValidationError(
          `STARTS WITH is only supported on text fields (${label})`
        );
      }
      return nest(path, {
        startsWith: coerce(predicate.value ?? null, "string", label),
        mode: "insensitive",
      });
    }
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const value = coerce(predicate.value ?? null, type, label);
      const key =
        predicate.operator === "gt"
          ? "gt"
          : predicate.operator === "gte"
            ? "gte"
            : predicate.operator === "lt"
              ? "lt"
              : "lte";
      return nest(path, { [key]: value });
    }
    case "in": {
      const raw = Array.isArray(predicate.value) ? predicate.value : [];
      const values = raw.map((entry) => coerce(entry, type, label));
      return nest(
        path,
        type === "string" ? { in: values, mode: "insensitive" } : { in: values }
      );
    }
    default:
      throw new QueryValidationError(`Unsupported filter operator`);
  }
}

/**
 * Builds one `where` fragment per predicate. Callers AND them together with
 * their own base conditions.
 */
export function buildFilterWhere(
  predicates: FilterPredicate[],
  fieldMap: FilterFieldMap
): PrismaWhere[] {
  return predicates.map((predicate) => {
    const descriptor = fieldMap[predicate.field];
    if (!descriptor) {
      throw new QueryValidationError(
        `Unsupported filter field: ${predicate.field}`
      );
    }

    const leaf = buildLeaf(descriptor, predicate);
    if (!descriptor.relation) return leaf;

    // `leaf` is already nested under the descriptor path (e.g.
    // `{ tag: { slug: { equals } } }`), so wrapping it in `some` yields
    // `{ tags: { some: { tag: { slug: ... } } } }`.
    return { [descriptor.relation]: { some: leaf } };
  });
}

/** Combines a base filter with the predicate fragments. */
export function withFilters(
  base: PrismaWhere,
  fragments: PrismaWhere[]
): PrismaWhere {
  if (fragments.length === 0) return base;
  return { AND: [base, ...fragments] };
}

/**
 * Builds a case-insensitive OR search across the given paths, or `null` when
 * there is nothing to search for.
 */
export function buildSearchWhere(
  search: string | null | undefined,
  paths: readonly string[]
): PrismaWhere | null {
  const term = (search ?? "").trim();
  if (!term || paths.length === 0) return null;

  return {
    OR: paths.map((path) =>
      nest(path, { contains: term, mode: "insensitive" })
    ),
  };
}
