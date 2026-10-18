/**
 * Shared kernel: grid filter expressions.
 *
 * tms-frontend's `GenericTable` serialises column filters into a single
 * `filters` string (`field OP value AND field OP value`). tms-backend then
 * validates it against an allowlist before handing it to Meilisearch.
 *
 * We accept the same grammar but translate it into structured predicates that
 * each domain maps onto Prisma `where` clauses. Nothing user-supplied ever
 * reaches the database as SQL/raw text: fields are allowlisted and values are
 * bound as Prisma parameters.
 *
 * Supported grammar:
 *   field = value            field != value
 *   field CONTAINS value     field STARTS WITH value
 *   field > value            field >= value   field < value   field <= value
 *   field IN [a, b, c]
 *   field IS NULL            field IS NOT NULL
 *   ... joined with AND, optionally parenthesised as a whole.
 */

export type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "startsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "isNull"
  | "isNotNull";

export type FilterValue = string | number | boolean | string[] | null;

export type FilterPredicate = {
  field: string;
  operator: FilterOperator;
  value?: FilterValue;
};

export class FilterExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FilterExpressionError";
  }
}

const OPERATOR_TOKENS: ReadonlyArray<{ token: string; operator: FilterOperator }> = [
  { token: "NOT CONTAINS", operator: "neq" },
  { token: "STARTS WITH", operator: "startsWith" },
  { token: "IS NOT NULL", operator: "isNotNull" },
  { token: "IS NULL", operator: "isNull" },
  { token: "CONTAINS", operator: "contains" },
  { token: "!=", operator: "neq" },
  { token: ">=", operator: "gte" },
  { token: "<=", operator: "lte" },
  { token: "=", operator: "eq" },
  { token: ">", operator: "gt" },
  { token: "<", operator: "lt" },
];

/**
 * Anchored at the start of the clause: the field must come first, so a value
 * that happens to contain an operator word (e.g. `title = "CONTAINS"`) cannot
 * be mistaken for the operator itself.
 */
const CLAUSE_PATTERN = new RegExp(
  `^([A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*)\\s*(${OPERATOR_TOKENS.map(
    (entry) => entry.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ).join("|")})\\s*([\\s\\S]*)$`,
  "i"
);

const IN_CLAUSE_PATTERN =
  /^([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s+IN\s*\[([\s\S]*)\]$/i;

const FIELD_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;

/** Strips one layer of surrounding quotes and unescapes `\"` / `\\`. */
function unquote(raw: string): string {
  const value = raw.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value
        .slice(1, -1)
        .replace(/\\(["'\\])/g, "$1");
    }
  }
  return value;
}

function parseScalar(raw: string): FilterValue {
  const trimmed = raw.trim();
  if (!trimmed) throw new FilterExpressionError("Filter value is missing.");

  if (/^"(?:[^"\\]|\\.)*"$/.test(trimmed) || /^'(?:[^'\\]|\\.)*'$/.test(trimmed)) {
    return unquote(trimmed);
  }
  if (/^true$/i.test(trimmed)) return true;
  if (/^false$/i.test(trimmed)) return false;
  if (/^null$/i.test(trimmed)) return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);

  // Bare words are allowed (`published = true`, `role = ADMIN`).
  if (/^[A-Za-z0-9_@.\-+:/ ]+$/.test(trimmed)) return trimmed;
  throw new FilterExpressionError(`Unsupported filter value: ${trimmed}`);
}

function parseList(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    throw new FilterExpressionError("IN requires a bracketed list.");
  }
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(",").map((part) => String(parseScalar(part)));
}

/** Splits on top-level `AND`, ignoring `AND` inside parentheses/quotes. */
function splitConjuncts(expression: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  const lower = expression.toLowerCase();

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (quote) {
      if (char === "\\") i++;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") depth++;
    else if (char === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0 && lower.startsWith(" and ", i)) {
      const part = expression.slice(start, i).trim();
      if (part) parts.push(part);
      i += 4;
      start = i + 1;
    }
  }

  const tail = expression.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

function stripOuterParens(clause: string): string {
  let value = clause.trim();
  while (value.startsWith("(") && value.endsWith(")")) {
    // Only strip when the outer pair actually wraps the whole clause.
    let depth = 0;
    let wraps = true;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "(") depth++;
      else if (value[i] === ")") {
        depth--;
        if (depth === 0 && i !== value.length - 1) {
          wraps = false;
          break;
        }
      }
    }
    if (!wraps) break;
    value = value.slice(1, -1).trim();
  }
  return value;
}

function parseClause(clause: string): FilterPredicate {
  const trimmed = stripOuterParens(clause);
  if (!trimmed) throw new FilterExpressionError("Empty filter clause.");

  // `field IN [...]` has no symbol operator, so match it first.
  const inMatch = IN_CLAUSE_PATTERN.exec(trimmed);
  if (inMatch) {
    return {
      field: inMatch[1],
      operator: "in",
      value: parseList(`[${inMatch[2]}]`),
    };
  }

  const match = CLAUSE_PATTERN.exec(trimmed);
  if (!match) {
    throw new FilterExpressionError(
      `Could not parse filter clause: ${trimmed}`
    );
  }

  const field = match[1];
  if (!FIELD_PATTERN.test(field)) {
    throw new FilterExpressionError(`Invalid filter field: ${field}`);
  }

  const token = match[2].toUpperCase().replace(/\s+/g, " ");
  const rest = match[3].trim();
  const operator = OPERATOR_TOKENS.find(
    (entry) => entry.token === token
  )?.operator;

  if (!operator) {
    throw new FilterExpressionError(`Unsupported operator: ${match[2]}`);
  }

  if (operator === "isNull" || operator === "isNotNull") {
    if (rest) {
      throw new FilterExpressionError(
        `${match[2].toUpperCase()} does not take a value (field: ${field}).`
      );
    }
    return { field, operator };
  }

  return { field, operator, value: parseScalar(rest) };
}

/**
 * Parses a filter expression into predicates.
 *
 * When `allowedFields` is provided, any field outside it rejects the whole
 * expression (matching tms-backend's allowlist policy).
 */
export function parseFilterExpression(
  expression: string | null | undefined,
  allowedFields?: readonly string[]
): FilterPredicate[] {
  const source = (expression ?? "").trim();
  if (!source) return [];

  const predicates = splitConjuncts(source).map(parseClause);

  if (allowedFields && allowedFields.length > 0) {
    const allowed = new Set(allowedFields.map((field) => field.toLowerCase()));
    const invalid = predicates.filter(
      (predicate) => !allowed.has(predicate.field.toLowerCase())
    );
    if (invalid.length > 0) {
      throw new FilterExpressionError(
        `The filters parameter contains unsupported fields: ${invalid
          .map((predicate) => predicate.field)
          .join(", ")}.`
      );
    }
  }

  return predicates;
}
