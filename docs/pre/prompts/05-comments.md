# Phase 5: Comments

> **Status:** ⏳ PLANNED
> **Prerequisites:** Phase 0-4 complete (especially Phase 4's blog post detail page)
> **Goal:** Build a comment system supporting both anonymous and authenticated users, with threaded replies.

---

## Consumes

- `<Card>`, `<CardContent>` from `@/components/ui/card` (Phase 0)
- `<Input>`, `<Textarea>`, `<Label>` from `@/components/ui/*` (Phase 0)
- `<Button>` from `@/components/ui/button` (Phase 0)
- `<Avatar>`, `<AvatarImage>`, `<AvatarFallback>` from `@/components/ui/avatar` (Phase 0)
- `<Skeleton>` from `@/components/ui/skeleton` (Phase 0)
- `db` from `@/lib/db` (Phase 1)
- `apiSuccess`, `apiError` from `@/lib/api-response` (Phase 1)
- `auth` from `@/auth` (Phase 2) — for authenticated comments
- Prisma `Comment` model with `parentId` (threaded) + `body` field (Phase 1)
- Blog post detail page from Phase 4 — comments render below post content

## Produces

### Files Created

| File | Exports |
|------|---------|
| `src/features/comments/types/index.ts` | `CommentPayload`, `CommentFormData`, `CommentApiError` |
| `src/features/comments/server/comment-service.ts` | `getCommentsByPostId`, `createComment`, `deleteComment` |
| `src/features/comments/components/comment-list.tsx` | `<CommentList postId refreshKey>` |
| `src/features/comments/components/comment-form.tsx` | `<CommentForm postId onCommentPosted>` |
| `src/features/comments/components/comment-section.tsx` | `<CommentSection postId>` |
| `src/features/comments/components/index.ts` | Barrel exports |
| `src/app/api/comments/route.ts` | `GET` (list by postId), `POST` (create) |

### Files Modified

| File | Changes |
|------|---------|
| `src/app/[locale]/(main)/blog/[slug]/page.tsx` | Add `<CommentSection postId={post.id} />` below article |

## Does NOT Build

- ❌ Comment moderation UI (admin feature)
- ❌ Rate limiting (deferred to Phase 8)
- ❌ Email notifications (out of scope)
- ❌ Rich text formatting in comments (plain text only)

## Contracts

### Types

```typescript
/** Shape returned by the API — safe to send to the client. */
export interface CommentPayload {
  id: string;
  body: string;                    // NOTE: field is "body" not "content" (matches Prisma schema)
  authorName: string;              // display name (user name or anonymous)
  userId: string | null;           // null = anonymous
  parentId: string | null;         // null = top-level comment
  status: "PENDING" | "APPROVED" | "REJECTED" | "SPAM";
  createdAt: string;               // ISO 8601
  replies?: CommentPayload[];      // nested children (threaded)
}

/** Shape submitted by the comment form. */
export interface CommentFormData {
  body: string;                    // required
  authorName?: string;             // required for anonymous
  authorEmail?: string;            // optional for anonymous
  parentId?: string;               // optional — for replies
}
```

> **Schema alignment:** The Prisma `Comment` model uses `body` (not `content`), `status` (CommentStatus enum, not `published` boolean), and `parentId` (threaded, not flat). Phase 5 code uses these actual field names.

### Comment Service

```typescript
export async function getCommentsByPostId(postId: string): Promise<CommentPayload[]>
// Fetches APPROVED comments, builds threaded tree from parentId relations.

export async function createComment(params: {
  postId: string;
  body: string;
  userId?: string | null;
  authorName?: string;
  authorEmail?: string;
  parentId?: string | null;
}): Promise<CommentPayload>
// Creates comment. Authenticated users: userId set, authorName null.
// Anonymous: userId null, authorName required.

export async function deleteComment(commentId: string, userId: string): Promise<boolean>
// Only the comment owner can delete. Soft-check via userId match.
```

### `<CommentSection>` — orchestrator

```typescript
import { CommentSection } from "@/features/comments/components";

<CommentSection postId={post.id} />
```

- Client component (`"use client"`)
- Manages `refreshKey` state to trigger refetch after new comment
- Renders `<CommentForm>` + `<CommentList>`
- Placed below blog post content in Phase 4's `[slug]/page.tsx`

### `<CommentForm>` — input

```typescript
<CommentForm postId={post.id} onCommentPosted={() => setRefreshKey(k => k + 1)} />
```

- Uses `<Input>` for name/email (anonymous only — hidden when authenticated)
- Uses `<Textarea>` for comment body
- Uses `<Button>` for submit
- Character counter (2000 max)
- Loading + error + success states

### `<CommentList>` — display

```typescript
<CommentList postId={post.id} refreshKey={refreshKey} />
```

- Fetches via `GET /api/comments?postId=xxx`
- Renders threaded replies (indented children)
- Uses `<Card>` for each comment
- Uses `<Avatar>` for author (image if authed, initial fallback if anonymous)
- Loading state: `<Skeleton>` placeholders
- Empty state: "No comments yet."

### API Routes

```typescript
// GET /api/comments?postId=xxx
return apiSuccess(comments);

// POST /api/comments
// Body: { postId, body, authorName?, authorEmail?, parentId? }
// Uses auth() to detect authenticated user
return apiSuccess(comment, { status: 201 });
// or apiError("Validation failed", { status: 400 });
```

## Implementation Steps

### Step 1: Create types

`src/features/comments/types/index.ts` per Contracts above.

### Step 2: Create comment service

`src/features/comments/server/comment-service.ts`:
- `getCommentsByPostId` — fetches comments, builds threaded tree from `parentId`
- `createComment` — uses `auth()` to detect session, sets `userId` or `authorName`
- `deleteComment` — ownership check via `userId`
- Maps Prisma `Comment` → `CommentPayload` (serializes dates to ISO strings)

### Step 3: Create API route

`src/app/api/comments/route.ts`:
- `GET` — query param `postId` required, returns `apiSuccess(comments)`
- `POST` — validates body, checks post exists, calls `auth()` for session, calls `createComment`

### Step 4: Create components

- `comment-form.tsx` — uses `<Input>`, `<Textarea>`, `<Button>`, `<Label>` from Phase 0
- `comment-list.tsx` — uses `<Card>`, `<Avatar>`, `<Skeleton>` from Phase 0; recursive render for threaded replies
- `comment-section.tsx` — orchestrates form + list
- `index.ts` — barrel exports

### Step 5: Integrate in blog post page

Edit `src/app/[locale]/(main)/blog/[slug]/page.tsx`:
- Import `CommentSection`
- Add `<CommentSection postId={post.id} />` below the article content

### Step 6: Verify

```bash
npx tsc --noEmit
npm run build
# Manual test:
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"postId":"<id>","body":"Test comment","authorName":"Tester"}'
```

---

## Verification Checklist

- [ ] Comment form renders with name/email fields (anonymous) or just textarea (authenticated)
- [ ] Submitting a comment updates the list without page reload
- [ ] Threaded replies display with indentation
- [ ] Authenticated comments show user avatar via `<Avatar>`
- [ ] Anonymous comments show first-letter fallback
- [ ] Loading state shows `<Skeleton>` placeholders
- [ ] Empty state: "No comments yet"
- [ ] Error states: empty body, missing name (anonymous)
- [ ] `GET /api/comments?postId=xxx` returns threaded tree
- [ ] `npx tsc --noEmit` passes

---

## Pitfalls

1. **Field name is `body`** — not `content`. The Prisma schema uses `body`. All service code, API routes, and types use `body`.
2. **Threaded tree building** — `getCommentsByPostId` must build the tree from flat records using `parentId`. Fetch all, then group by parent.
3. **`auth()` in API route** — NOT `getServerSession()`. Auth.js v5 uses `auth()` from `@/auth`.
4. **Comment status** — New comments default to `PENDING` in schema. For v1, treat `PENDING` as visible (no moderation queue). Phase 8 can add moderation.

---

*Phase 5 complete. Next: [Phase 6 — Bookmarks](./06-bookmarks.md)*
