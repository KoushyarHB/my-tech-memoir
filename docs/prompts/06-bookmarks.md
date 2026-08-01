# Phase 6: Bookmarks

> **Status:** ⏳ PLANNED
> **Prerequisites:** Phase 0-5 complete (especially Phase 2 auth + Phase 4 blog post page)
> **Goal:** Let signed-in users bookmark posts. Toggle from post pages, view all at `/bookmarks`.

---

## Consumes

- `<Button>` from `@/components/ui/button` (Phase 0)
- `<PostCard>` from `@/features/blog/components` (Phase 4)
- `<Container>`, `<PageHeader>` from `@/components/layout` (Phase 0)
- `db` from `@/lib/db` (Phase 1)
- `apiSuccess`, `apiError` from `@/lib/api-response` (Phase 1)
- `auth` from `@/auth` (Phase 2) — session required for all bookmark operations
- Prisma `Bookmark` model with `@@unique([postId, userId])` (Phase 1)
- `useSession()` from `next-auth/react` (Phase 2) — client-side auth state

## Produces

### Files Created

| File | Exports |
|------|---------|
| `src/features/bookmarks/types/index.ts` | `BookmarkWithPost`, `ToggleBookmarkResponse` |
| `src/features/bookmarks/server/bookmark-service.ts` | `isBookmarked`, `toggleBookmark`, `getBookmarksByUserId` |
| `src/features/bookmarks/components/bookmark-button.tsx` | `<BookmarkButton postId initialBookmarked>` |
| `src/features/bookmarks/components/index.ts` | Barrel exports |
| `src/app/api/bookmarks/route.ts` | `GET` (list or check), `POST` (toggle) |
| `src/app/[locale]/(main)/bookmarks/page.tsx` | Bookmarks listing page |

### Files Modified

| File | Changes |
|------|---------|
| `src/app/[locale]/(main)/blog/[slug]/page.tsx` | Add `<BookmarkButton>` in post header |
| `src/components/Header.tsx` | Add "Bookmarks" nav link (visible when authenticated) |

## Does NOT Build

- ❌ Reading progress tracking (deferred — separate feature)
- ❌ Bookmark folders/collections (future iteration)
- ❌ Public bookmark sharing (out of scope)

## Contracts

### Types

```typescript
import type { Post, Bookmark } from "@/generated/prisma/client";

export type BookmarkWithPost = Bookmark & { post: Post };

export type ToggleBookmarkResponse = {
  bookmarked: boolean;
  bookmarkId: string | null;
};
```

### Bookmark Service

```typescript
export async function isBookmarked(userId: string, postId: string): Promise<boolean>
// Checks @@unique([postId, userId]) — returns true/false.

export async function toggleBookmark(userId: string, postId: string): Promise<ToggleBookmarkResponse>
// If exists: delete, return { bookmarked: false, bookmarkId: null }
// If not: create, return { bookmarked: true, bookmarkId: id }

export async function getBookmarksByUserId(userId: string): Promise<BookmarkWithPost[]>
// All bookmarks for user, newest first, with post data included.
```

> **Uses `apiSuccess`/`apiError`** (Phase 1 canonical helpers) — NOT the `apiResponse({data,error,status})` signature from the original Phase 6 prompt. That was discarded.

### `<BookmarkButton>` — toggle

```typescript
import { BookmarkButton } from "@/features/bookmarks/components";

<BookmarkButton postId={post.id} initialBookmarked={false} />
```

- Client component (`"use client"`)
- Uses `<Button variant="ghost" size="icon">` from Phase 0
- Uses `Bookmark` icon from `lucide-react` (filled when bookmarked)
- Fetches initial state on mount via `GET /api/bookmarks?postId=xxx`
- Toggles via `POST /api/bookmarks` with `{ postId }`
- Redirects to `/signin` if unauthenticated click
- Loading state: disabled button

### API Routes

```typescript
// GET /api/bookmarks
// Query: ?postId=xxx → check single post → apiSuccess({ bookmarked: boolean })
// No query → list all → apiSuccess(bookmarks[])
// Requires: auth() session

// POST /api/bookmarks
// Body: { postId: string }
// Returns: apiSuccess({ bookmarked, bookmarkId })
// Requires: auth() session
```

### Route Paths

| Path | Type | Auth |
|------|------|------|
| `/[locale]/bookmarks` | Server Component | Required (redirects to `/signin` if not) |
| `/api/bookmarks` | Route Handler | Required (401 if not) |

## Implementation Steps

### Step 1: Create types

`src/features/bookmarks/types/index.ts` per Contracts.

### Step 2: Create bookmark service

`src/features/bookmarks/server/bookmark-service.ts`:
- Uses `db.bookmark.findUnique({ where: { postId_userId: { postId, userId } } })`
- `toggleBookmark` checks existence first, then creates or deletes

### Step 3: Create API route

`src/app/api/bookmarks/route.ts`:
- Both `GET` and `POST` require `auth()` session
- Return `apiError("Authentication required", { status: 401 })` if no session
- Uses `session.user.id` (from Phase 2's JWT callback)

### Step 4: Create BookmarkButton

`src/features/bookmarks/components/bookmark-button.tsx`:
- `useSession()` for auth state
- `useEffect` to fetch initial bookmarked state
- `useCallback` for toggle handler
- `<Button variant="ghost" size="icon">` with `Bookmark` icon from lucide

### Step 5: Create bookmarks page

`src/app/[locale]/(main)/bookmarks/page.tsx`:
- Server Component, requires `auth()` session
- Calls `getBookmarksByUserId(session.user.id)`
- Renders `<PostCard>` for each bookmark (reusing Phase 4 component)
- Empty state when no bookmarks
- Uses `<Container>` + `<PageHeader>` from Phase 0

### Step 6: Integrate in blog post page

Edit `src/app/[locale]/(main)/blog/[slug]/page.tsx`:
- Add `<BookmarkButton postId={post.id} />` next to reading time in `<PostHeader>`

### Step 7: Add Header link

Edit `src/components/Header.tsx`:
- Add "Bookmarks" `<Link>` visible only when `session?.user` exists
- Place between logo and theme toggle, or in a nav section

### Step 8: Verify

```bash
npx tsc --noEmit
npm run build
```

---

## Verification Checklist

- [ ] Bookmark icon appears on blog post pages
- [ ] Clicking while signed in toggles bookmark state
- [ ] Clicking while signed out redirects to `/signin`
- [ ] `/bookmarks` shows saved posts using `<PostCard>`
- [ ] Empty state shows when no bookmarks
- [ ] "Bookmarks" link in Header only for authenticated users
- [ ] Unbookmarking removes post from `/bookmarks` page
- [ ] `GET /api/bookmarks?postId=xxx` returns `{ bookmarked }`
- [ ] `POST /api/bookmarks` with `{ postId }` returns `{ bookmarked, bookmarkId }`
- [ ] `npx tsc --noEmit` passes

---

## Pitfalls

1. **Composite unique constraint** — Prisma uses `postId_userId` as the compound key name. `findUnique({ where: { postId_userId: { postId, userId } } })`.
2. **Do NOT import server services in client components** — `BookmarkButton` communicates ONLY through `fetch("/api/bookmarks")`. Never imports `bookmark-service.ts`.
3. **`session.user.id` must exist** — Phase 2's JWT callback exposes `user.id` on the session. If missing, bookmarks will fail silently.
4. **`apiSuccess` not `apiResponse`** — Use Phase 1's canonical helpers. The original prompt's `apiResponse({data, error, status})` was discarded.

---

*Phase 6 complete. Next: [Phase 7 — Home & About](./07-home-about.md)*
