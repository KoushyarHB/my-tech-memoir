# TASKS.md — my-tech-memoir

> Contract-Driven implementation checklist with explicit dependencies and status tracking.

---

## Phase Overview

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ COMPLETED | Design System — tokens, shadcn/ui primitives, layout helpers |
| 1 | ✅ COMPLETED | Infrastructure — Prisma schema, DB client, API helpers |
| 2 | ✅ COMPLETED | Authentication — Auth.js v5, GitHub + Google, sign-in page |
| 3 | ✅ COMPLETED | Layout & i18n — next-intl, route restructure, language switcher |
| 4 | ✅ COMPLETED | Blog — post service, components, pages, seed migration |
| 5 | ✅ COMPLETED | Comments — threaded comments, anonymous + authenticated |
| 6 | ✅ COMPLETED | Bookmarks — toggle, listing page, API routes |
| 7 | ✅ COMPLETED | Home & About — DB-driven homepage, about page |
| 8 | ✅ COMPLETED | Polish — ESLint, error boundaries, loading states, SEO |
| 9 | ⏳ PLANNED | Admin & Editor — Tiptap WYSIWYG, auto-save, image upload, dashboard |

---

## Phase 0: Design System ⏳

### Task 0.1: shadcn/ui Init + Primitives
**Dependencies:** None
**Files:** `components.json`, `src/lib/utils.ts`, `src/components/ui/*`

- [ ] Run `npx shadcn@latest init`
- [ ] Add: `button card input label badge textarea avatar separator skeleton spinner`
- [ ] Install `lucide-react`, `tw-animate-css`

### Task 0.2: Token Alias Layer
**Dependencies:** Task 0.1
**Files:** `src/app/globals.css`

- [ ] Add shadcn alias layer mapping to our tokens
- [ ] Add `@theme inline` block for Tailwind utilities
- [ ] Add `@import "tw-animate-css"`

### Task 0.3: Layout Primitives
**Dependencies:** Task 0.1
**Files:** `src/components/layout/*`

- [ ] Create `Container`, `Section`, `PageHeader`
- [ ] Create barrel export `index.ts`

### Task 0.4: Refactor Existing Components
**Dependencies:** Task 0.1, 0.2, 0.3
**Files:** Header, sign-in page, sign-in buttons, home page, posts page

- [ ] Replace inline-styled buttons with `<Button>`
- [ ] Replace card divs with `<Card>`
- [ ] Replace tag spans with `<Badge>`
- [ ] Replace inline SVGs with lucide icons

---

## Phase 1: Infrastructure ✅

- [x] Task 1.1: Prisma schema (10 models + 3 enums)
- [x] Task 1.2: Prisma client singleton (`src/lib/db.ts`)
- [x] Task 1.3: API response helpers (`src/lib/api-response.ts`)
- [x] Task 1.4: `.env.example` with `DATABASE_URL` + `DIRECT_URL`
- [x] Task 1.5: Migration reset (stale baseline deleted)
- [ ] Task 1.6: **Pending user** — create `.env`, run `npx prisma migrate dev --name init`

---

## Phase 2: Authentication ✅

- [x] Task 2.1: Auth.js v5 config (`src/auth.ts`)
- [x] Task 2.2: Route handler (`src/app/api/auth/[...nextauth]/route.ts`)
- [x] Task 2.3: SessionProvider wrapper
- [x] Task 2.4: Type augmentation (`next-auth.d.ts`)
- [x] Task 2.5: Sign-in page + buttons
- [x] Task 2.6: Header auth integration
- [x] Task 2.7: Proxy file (`src/proxy.ts` — Next.js 16 rename)
- [ ] Task 2.8: **Pending user** — OAuth credentials + `AUTH_SECRET`

---

## Phase 3: Layout & i18n ⏳

### Task 3.1: next-intl Setup
**Dependencies:** Phase 2
**Files:** `src/i18n/*`, `messages/*`, `next.config.js`

- [ ] Install `next-intl`
- [ ] Create `routing.ts`, `request.ts`
- [ ] Create `messages/en.json`, `messages/fa.json`
- [ ] Wrap `next.config.js` with `withNextIntl`

### Task 3.2: Route Restructure
**Dependencies:** Task 3.1
**Files:** `src/app/[locale]/*`

- [ ] Move all pages under `[locale]/`
- [ ] Create `[locale]/(main)/layout.tsx`

### Task 3.3: Header + Footer Updates
**Dependencies:** Phase 0, Task 3.1

- [ ] Add LanguageSwitcher to Header
- [ ] Translate Header strings
- [ ] Add social links to Footer

### Task 3.4: Merge Proxy
**Dependencies:** Task 3.1, Phase 2

- [ ] Merge auth + i18n middleware in `src/proxy.ts`

---

## Phase 4: Blog ⏳

### Task 4.1: Types + Service
**Dependencies:** Phase 1
**Files:** `src/features/blog/types/`, `src/features/blog/server/`, `src/features/blog/lib/`

- [ ] Create `PostSummary`, `PostWithTags`, `CreatePostInput`, `UpdatePostInput`
- [ ] Create `reading-time.ts`
- [ ] Create `post-service.ts` (CRUD + search + by-tag)

### Task 4.2: Components
**Dependencies:** Task 4.1, Phase 0
**Files:** `src/features/blog/components/`

- [ ] Create `PostCard` (uses `<Card>`, `<Badge>`)
- [ ] Create `PostHeader` (uses `<Badge>`)

### Task 4.3: Pages
**Dependencies:** Task 4.2
**Files:** `src/app/[locale]/(main)/blog/*`

- [ ] Blog list page
- [ ] Blog post detail page
- [ ] Tag filter page

### Task 4.4: API Routes
**Dependencies:** Task 4.1
**Files:** `src/app/api/posts/*`

- [ ] `GET/POST /api/posts`
- [ ] `GET/PUT/DELETE /api/posts/[id]`

### Task 4.5: Seed Migration
**Dependencies:** Task 4.1 (needs DB)

- [ ] Write `prisma/seed.ts`
- [ ] Delete static `.tsx` post files
- [ ] Add `/posts/*` → `/blog/*` redirect

---

## Phase 5: Comments ⏳

### Task 5.1: Types + Service
- [ ] Create comment types (`CommentPayload`, `CommentFormData`)
- [ ] Create `comment-service.ts` (threaded, `body` field)

### Task 5.2: Components
- [ ] Create `CommentForm` (uses `<Input>`, `<Textarea>`, `<Button>`)
- [ ] Create `CommentList` (uses `<Card>`, `<Avatar>`, `<Skeleton>`)
- [ ] Create `CommentSection` (orchestrator)

### Task 5.3: API Route + Integration
- [ ] Create `GET/POST /api/comments`
- [ ] Add `<CommentSection>` to blog post page

---

## Phase 6: Bookmarks ⏳

### Task 6.1: Types + Service
- [ ] Create bookmark types
- [ ] Create `bookmark-service.ts` (toggle, check, list)

### Task 6.2: Component + API
- [ ] Create `BookmarkButton` (uses `<Button>`, lucide `Bookmark` icon)
- [ ] Create `GET/POST /api/bookmarks` (uses `apiSuccess`/`apiError`)

### Task 6.3: Page + Integration
- [ ] Create `/bookmarks` page (uses `<PostCard>`)
- [ ] Add `<BookmarkButton>` to blog post header
- [ ] Add "Bookmarks" link to Header (authenticated only)

---

## Phase 7: Home & About ⏳

### Task 7.1: Home Page
- [ ] Replace with DB-driven page using `<PostCard>` from Phase 4

### Task 7.2: About Page
- [ ] Create bio, skills (`<Badge>`), social links, contact (`<Button>`)

---

## Phase 8: Polish ⏳

### Task 8.1: ESLint Setup
- [ ] Install `eslint`, `eslint-config-next`, `@eslint/eslintrc`
- [ ] Create `eslint.config.mjs` (flat config)
- [ ] Fix `lint` script in `package.json`

### Task 8.2: Error + Loading
- [ ] Create `not-found.tsx`
- [ ] Create `global-error.tsx`
- [ ] Create segment `error.tsx`
- [ ] Create `loading.tsx` files (using `<Skeleton>`, `<Spinner>`)

### Task 8.3: SEO
- [ ] Enhance root metadata
- [ ] Verify all pages have titles + descriptions
