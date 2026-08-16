# Phase 9: Admin Panel & Post Editor

> **Status:** ⏳ PLANNED
> **Prerequisites:** Phase 0-8 complete
> **Goal:** Auth-gated admin panel with Tiptap rich-text editor, auto-save drafts, image upload via Vercel Blob, post management dashboard.

---

## Consumes

- `<Button>`, `<Card>`, `<Badge>`, `<Input>`, `<Textarea>`, `<Label>`, `<Avatar>` from Phase 0
- `auth()` from `@/auth` (Phase 2) — extended with `role`
- `db` from `@/lib/db` (Phase 1)
- `apiSuccess`, `apiError` from `@/lib/api-response` (Phase 1)
- Post service CRUD functions from Phase 4
- Prisma `UserRole` enum (`USER`, `EDITOR`, `ADMIN`) from Phase 1

## Produces

### Files Created

| File | Exports |
|------|---------|
| `src/lib/auth-guard.ts` | `requireEditor()`, `requireEditorApi()` |
| `scripts/promote-admin.ts` | CLI: promotes user to ADMIN role |
| `src/features/admin/components/post-editor.tsx` | `<PostEditor>` — Tiptap WYSIWYG with toolbar |
| `src/features/admin/components/editor-toolbar.tsx` | `<EditorToolbar>` — formatting buttons |
| `src/features/admin/components/post-meta-sidebar.tsx` | `<PostMetaSidebar>` — title/slug/excerpt/tags/publish |
| `src/features/admin/components/save-status.tsx` | `<SaveStatus>` — auto-save indicator |
| `src/features/admin/components/post-table.tsx` | `<PostTable>` — dashboard post list |
| `src/features/admin/components/index.ts` | Barrel exports |
| `src/app/admin/layout.tsx` | Auth guard layout |
| `src/app/admin/page.tsx` | Dashboard with stats + post table |
| `src/app/admin/new/page.tsx` | New post editor |
| `src/app/admin/[id]/page.tsx` | Edit post editor |
| `src/app/api/tags/route.ts` | `GET` — list all tags |
| `src/app/api/upload/route.ts` | `POST` — image upload to Vercel Blob |

### Files Modified

| File | Changes |
|------|---------|
| `src/auth.ts` | JWT callback reads `role` from DB, session callback exposes it |
| `src/features/auth/types/next-auth.d.ts` | Add `role` to `Session.user` and `JWT` |
| `src/app/api/posts/route.ts` | Add auth guard to `POST` |
| `src/app/api/posts/[id]/route.ts` | Add auth guard to `PUT`, `DELETE` |
| `package.json` | Add `promote-admin` script |

### Dependencies Installed

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
            @tiptap/extension-link @tiptap/extension-placeholder \
            @tiptap/extension-typography @tiptap/extension-image \
            @vercel/blob

npx shadcn@latest add table tabs select switch alert-dialog dialog tooltip
```

## Does NOT Build

- ❌ Comment moderation UI (deferred)
- ❌ User management / role assignment UI (use promote-admin script)
- ❌ Analytics dashboard (Vercel Analytics handles this)
- ❌ RTL support for admin (English-only admin is fine)

## Contracts

### `requireEditor()` — server component guard

```typescript
import { requireEditor } from "@/lib/auth-guard";

// In any Server Component or layout:
const session = await requireEditor();
// Returns session if user is EDITOR or ADMIN
// Redirects to /signin if unauthenticated
// Redirects to / if authenticated but not EDITOR/ADMIN
```

### `requireEditorApi()` — API route guard

```typescript
import { requireEditorApi } from "@/lib/auth-guard";

// In any Route Handler:
const session = await requireEditorApi();
if (!session) return apiError("Forbidden", { status: 403 });
// Returns null + sends 403 if not EDITOR/ADMIN
```

### Session shape (after Phase 9)

```typescript
session.user.id    // string (database user ID)
session.user.role  // "USER" | "EDITOR" | "ADMIN"
session.user.name  // string | null
session.user.email // string | null
session.user.image // string | null
```

### `<PostEditor>` — Tiptap WYSIWYG

```typescript
<PostEditor
  initialContent={string}      // HTML string from DB
  onChange={(html: string) => void}
  editable={boolean}
/>
```

- Client component (`"use client"`)
- Extensions: StarterKit, Link, Placeholder, Typography, Image
- Toolbar: Bold, Italic, H1/H2/H3, BulletList, OrderedList, Blockquote, CodeBlock, Link, Image, HR
- Outputs HTML via `editor.getHTML()`

### Admin route paths

| Path | Type | Auth |
|------|------|------|
| `/admin` | Server Component | EDITOR/ADMIN |
| `/admin/new` | Server Component | EDITOR/ADMIN |
| `/admin/[id]` | Server Component | EDITOR/ADMIN |
| `/api/tags` | Route Handler | EDITOR/ADMIN |
| `/api/upload` | Route Handler | EDITOR/ADMIN |

> Admin routes live at root (`/admin`), NOT under `[locale]/`. Admin is English-only.

### Auto-save behavior

- Debounced 3-second save after last keystroke
- First save: `POST /api/posts` (creates draft, gets ID)
- Subsequent saves: `PUT /api/posts/[id]` (updates draft)
- Status indicator: "Unsaved" → "Saving…" → "Saved ✓"
- Auto-save disabled for published posts (explicit save only)
- "Publish" and "Unpublish" are explicit button actions

### Image upload flow

1. User drags image into editor OR clicks Image toolbar button
2. `POST /api/upload` with FormData (image file)
3. Server uploads to Vercel Blob, returns `{ url: string }`
4. Tiptap Image extension inserts `<img src={url} />`
5. Content saved as HTML in post `content` field

### Environment variables (new)

```bash
# Vercel Blob — https://vercel.com/docs/storage/vercel-blob
BLOB_READ_WRITE_TOKEN=""
```

## Implementation Steps

### Step 1: Documentation (this file + update README/TASKS/ARCHITECTURE)

### Step 2: Auth changes
- Update `auth.ts` callbacks to include `role`
- Update type augmentation
- Create `src/lib/auth-guard.ts`

### Step 3: Promote-admin script
- `scripts/promote-admin.ts` — accepts email arg, sets role to ADMIN

### Step 4: Secure API routes
- Add `requireEditorApi()` to POST/PUT/DELETE on `/api/posts`

### Step 5: Install dependencies
- Tiptap packages + Vercel Blob + shadcn primitives

### Step 6: Create API routes
- `/api/tags` (GET — list tags)
- `/api/upload` (POST — Vercel Blob upload)

### Step 7: Create editor components
- `<PostEditor>` with Tiptap
- `<EditorToolbar>` with formatting buttons
- `<PostMetaSidebar>` with form fields
- `<SaveStatus>` indicator

### Step 8: Create admin pages
- Layout with auth guard
- Dashboard with stats + post table
- New post page
- Edit post page

### Step 9: Verify
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

---

## Verification Checklist

- [ ] `session.user.role` is populated after login
- [ ] `promote-admin` script works: `npm run promote-admin -- email@example.com`
- [ ] Unauthenticated users redirected from `/admin` to `/signin`
- [ ] `USER` role redirected from `/admin` to `/`
- [ ] `EDITOR`/`ADMIN` can access `/admin`
- [ ] Dashboard shows post table with status badges
- [ ] "New Post" opens Tiptap editor
- [ ] Editor toolbar formats text (bold, headings, lists, code, quote, link)
- [ ] Image upload works (drag-and-drop + toolbar button)
- [ ] Auto-save triggers after 3s of inactivity (drafts only)
- [ ] Save status indicator updates correctly
- [ ] "Publish" button sets `published: true`
- [ ] Edit existing post loads content into editor
- [ ] Delete with confirmation dialog works
- [ ] `POST/PUT/DELETE /api/posts` returns 403 for non-editors
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

---

## Pitfalls

1. **Tiptap SSR** — Must set `immediatelyRender: false` in `useEditor()` config. Without it, React hydration mismatch errors occur.
2. **`role` not on JWT by default** — The JWT callback must explicitly query the DB for `role` on first login (when `user` is present), then store it on `token`. Subsequent requests read from `token` without a DB query.
3. **Vercel Blob token** — `BLOB_READ_WRITE_TOKEN` must be in `.env`. Without it, uploads fail silently.
4. **Auto-save race conditions** — If user navigates away mid-save, the debounced save may not fire. Use `beforeunload` or route leave guard.
5. **HTML sanitization** — Tiptap output is safe (structured, not arbitrary HTML). But if you ever accept pasted HTML, sanitize it. Tiptap's clipboard plugin handles this.
6. **Slug collisions** — `@unique` on `slug`. The editor should auto-generate slug from title and check for collisions.

---

*Phase 9 complete. The project now has a full admin panel for content management.*
