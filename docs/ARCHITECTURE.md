# Architecture

This app uses a layered, domain-first structure modelled on the TMS platform
(`tms-backend` + `tms.frontend`), adapted to the Next.js App Router.

The goal is that any feature can be read top-to-bottom in one direction:

```
component  →  hook  →  service (client)  →  route handler  →  service (server)  →  repository  →  Prisma
```

Nothing skips a layer, and dependencies only point inward.

---

## 1. Layering

| Layer | Location | Responsibility | May import |
|---|---|---|---|
| **Components** | `features/<domain>/components` | Render UI. No `fetch`, no Prisma. | hooks, types, constants, `components/ui` |
| **Hooks** | `features/<domain>/hooks` | TanStack Query bindings: cache keys, invalidation, optimistic updates. | services (client), types, constants, `lib/query-keys` |
| **Client services** | `features/<domain>/services` | One function per endpoint. Typed DTO in, typed DTO out. No React. | `lib/api-client`, types, `shared/lib` |
| **Route handlers** | `app/api/**/route.ts` | HTTP concerns only: auth guard, query parsing, status codes, error mapping. | server services, `shared/lib/pagination`, `lib/api-response` |
| **Server services** | `features/<domain>/server/*-service.ts` | Business rules and invariants (validation, permissions, publish bookkeeping). | repositories, constants, types |
| **Repositories** | `features/<domain>/server/*-repository.ts` | Prisma access. Returns DTOs, never raw records. | `lib/db`, `shared/lib/prisma-filter` |
| **Shared kernel** | `src/shared` | Cross-domain primitives (pagination contract, filter grammar, DTO envelope). | nothing domain-specific |

**Rules**

1. A component never calls `fetch`. Only `lib/api-client` does.
2. A repository never returns a Prisma model. It maps to a DTO first.
3. A route handler never contains a Prisma query.
4. A server service never knows about `Request`/`Response`.
5. Cross-domain imports go through the other domain's `types` / `server` entry points, never into its internals.

---

## 2. Domain layout

Every domain has the same skeleton. Folders appear only when needed.

```
features/<domain>/
  components/            UI
  hooks/                 TanStack Query hooks
  services/              client-side API functions
  server/
    <entity>-repository.ts   Prisma + DTO mapping
    <entity>-service.ts      business rules
  types/
    request/             inbound DTOs (Create/Update payloads)
    response/            outbound DTOs (Get*)
    index.ts             the domain's public type surface
  constants/             query allowlists, limits, labels
  lib/                   domain-only helpers (pure functions)
```

### Domains

| Domain | Owns |
|---|---|
| `blog` | Posts: CRUD, publish state, view counting, post queries |
| `tags` | Tags: listing, creation, stats |
| `comments` | Comment threads, replies, moderation status |
| `bookmarks` | Per-user bookmarks |
| `users` | User administration: list, roles, stats |
| `admin` | Dashboard + admin shell. Composes the domains above. |
| `auth` | Session types and sign-in UI |

`admin` is a **consumer** domain: it owns the dashboard and the admin chrome,
but all post/tag/user data comes from their own domains.

---

## 3. Pagination contract

List endpoints share one contract, identical to `PaginationResult<T>` in
`tms-backend/libs/utility`.

### Request

```
GET /api/<resource>?page=1&pageSize=20&search=…&filters=…&sortBy=…&sortOrder=…
```

| Param | Rules |
|---|---|
| `page` | integer ≥ 1, default `1` |
| `pageSize` | integer 1–100, default `20` |
| `search` | free text, ≤ 200 chars, matched case-insensitively across the domain's search fields |
| `filters` | grid expression, ≤ 2000 chars (see below) |
| `sortBy` | one of the domain's `*_SORT_FIELDS`; unknown values fall back to the default |
| `sortOrder` | `asc` or `desc` |
| `searchFields` | comma-separated subset of the domain's search fields |

### Response

```json
{
  "success": true,
  "data": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 57,
    "totalPages": 3,
    "items": [ … ]
  }
}
```

The envelope (`success`/`data`/`error`) is this app's transport convention; the
pagination object inside `data` is byte-compatible with tms-backend, so client
code can be shared.

### Filter grammar

`filters` is the same expression format `tms.frontend`'s `GenericTable` builds:

```
published = "true" AND title CONTAINS "react" AND viewCount >= 10
```

Supported: `=`, `!=`, `CONTAINS`, `STARTS WITH`, `>`, `>=`, `<`, `<=`,
`IN [a, b]`, `IS NULL`, `IS NOT NULL`, joined with `AND`, optionally wrapped in
parentheses.

Parsing happens in `shared/lib/filter-expression.ts`; mapping to Prisma happens
in `shared/lib/prisma-filter.ts`. Every field is allowlisted per domain and
every value is bound as a Prisma parameter — user input is never interpolated
into a query.

---

## 4. Query state on the client

Admin tables are **server-driven**. `DataTable` runs in manual mode
(`manualPagination`, `manualSorting`, `manualFiltering`) and reports UI state to
`useDataTableQuery`, which converts it to the wire query:

```
DataTableQuery { page, pageSize, search, sorting[], columnFilters[] }
        ↓  useDataTableQuery
PaginationQuery { page, pageSize, search, filters, sortBy, sortOrder }
```

Column definitions declare their server field in `meta`:

```ts
meta: { filterField: "published", filterOperator: "eq", filterVariant: "select" }
```

`DataTable` turns those into the `filters` string via `onFiltersChange`; the view
never assembles filter strings by hand.

Cache keys include the whole query object, so every page/sort/filter combination
is its own cache entry, and `keepPreviousData` keeps the current rows on screen
while the next page loads.

Mutations invalidate the domain root (`queryKeys.posts.all`), which also covers
the domain's stats query (`["posts", "stats"]`).

---

## 5. Server rendering vs. client fetching

Both paths use the same services and DTOs:

- **First paint** — server components call the server services directly and pass
  the result as `initialData` to the matching hook.
- **Interactions** — the hook fetches from the route handler with the same DTO
  shape.

This is why every DTO uses ISO strings for dates: the value coming from the
server component and the value coming from `JSON` are identical, so hydration is
safe and no date re-parsing is needed in components.

Public pages keep page state in the URL (`?page=2`) and render
`components/pagination/pagination-links.tsx`; admin tables keep it in React
state and drive TanStack Query.

---

## 6. Error handling

| Kind | Type | Status |
|---|---|---|
| Bad query params / filters | `QueryValidationError`, `FilterExpressionError` | 400 |
| Domain rule violations | `PostValidationError`, `TagValidationError`, `UserValidationError`, `CommentValidationError` (each carries `status`) | 400 / 404 / 409 |
| Missing session / role | `requireEditorApi` / `requireAdminApi` returning `null` | 403 |
| Unexpected | logged + generic message | 500 |

`apiQueryError(error)` centralises the query-error → 400 mapping so every list
handler behaves the same.

On the client, `api-client` throws `ApiError` (carrying `status` and the server's
message); hooks surface `getErrorMessage(error, fallback)` to toasts.

---

## 7. Adding a new paginated resource

1. `features/<domain>/constants/<entity>.ts` — `*_SORT_FIELDS`, `*_SEARCH_FIELDS`,
   `*_FILTER_FIELDS`, `*_FILTER_MAP`, limits.
2. `features/<domain>/types/response/get-<entity>.dto.ts` — the list projection.
3. `features/<domain>/server/<entity>-repository.ts` — `find<Entity>Page(query)`
   using `parseFilters` + `buildFilterWhere` + `buildSearchWhere` + `resolveSort`
   + `createPaginatedResult`.
4. `features/<domain>/server/<entity>-service.ts` — business rules on top.
5. `app/api/<entity>/route.ts` — `parsePaginationQuery` → service → `apiPaginated`.
6. `features/<domain>/services/<entity>-service.ts` — `fetch<Entity>Page(query)`.
7. `features/<domain>/hooks/use-<entity>.ts` — `use<Entity>Page` with
   `keepPreviousData`.
8. Wire a `DataTable` with `useDataTableQuery` and declare `filterField` on each
   filterable column.
9. Add the query key to `lib/query-keys.ts`.

Steps 1–4 are shared by the server component and the API route, so there is
never a second implementation of the same query.

---

## 8. Verification

- `npm run verify:query` — pure-function checks for pagination parsing, filter
  grammar, and Prisma `where` generation (no database required).
- `npx tsc --noEmit` — type check.
- `npm run lint` — ESLint.
- `npm run build` — production build (also validates route conflicts).
