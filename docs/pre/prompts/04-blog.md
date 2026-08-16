# Phase 4: Blog Feature

> **Status:** ⏳ PLANNED
> **Prerequisites:** Phase 0 (Design System), Phase 1 (Infrastructure), Phase 2 (Auth), Phase 3 (Layout & i18n)
> **Goal:** Build the blog reading experience — post types, service layer, components, pages, and REST API. Migrate existing static posts to the database.

---

## Consumes

- `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>` from `@/components/ui/card` (Phase 0)
- `<Badge>` from `@/components/ui/badge` (Phase 0)
- `<Container>`, `<PageHeader>` from `@/components/layout` (Phase 0)
- `cn()` from `@/lib/utils` (Phase 0)
- `db` from `@/lib/db` (Phase 1)
- `apiSuccess`, `apiError` from `@/lib/api-response` (Phase 1)
- Prisma models: `Post`, `Tag`, `PostTag`, `PostAuthor` (Phase 1)
- `[locale]` route structure (Phase 3)

## Produces

### Files Created

| File | Exports |
|------|---------|
| `src/features/blog/types/index.ts` | `Tag`, `PostWithTags`, `PostSummary`, `CreatePostInput`, `UpdatePostInput` |
| `src/features/blog/lib/reading-time.ts` | `estimateReadingTime(content: string): string`, `readingTimeMinutes(content: string): number` |
| `src/features/blog/server/post-service.ts` | `getPublishedPosts`, `getAllPosts`, `getPostBySlug`, `getPostById`, `createPost`, `updatePost`, `deletePost`, `getPostsByTag`, `searchPosts` |
| `src/features/blog/components/post-card.tsx` | `<PostCard post={PostSummary} />` |
| `src/features/blog/components/post-header.tsx` | `<PostHeader post={PostWithTags} />` |
| `src/features/blog/components/index.ts` | Barrel exports |
| `src/app/[locale]/(main)/blog/page.tsx` | Blog list page (Server Component) |
| `src/app/[locale]/(main)/blog/[slug]/page.tsx` | Blog post detail (Server Component) |
| `src/app/[locale]/(main)/blog/tag/[slug]/page.tsx` | Posts by tag (Server Component) |
| `src/app/api/posts/route.ts` | `GET` (list), `POST` (create) |
| `src/app/api/posts/[id]/route.ts` | `GET`, `PUT`, `DELETE` |
| `prisma/seed.ts` | Seed script — migrates 3 static posts to DB |
| `next.config.js` | Updated — adds redirect `/posts/*` → `/blog/*` |

### Files Deleted

| File | Reason |
|------|--------|
| `src/app/[locale]/(main)/posts/networking-101/page.tsx` | Content migrated to DB via seed script |
| `src/app/[locale]/(main)/posts/understanding-reacts-state-tree-and-closures/page.tsx` | Same |
| `src/app/[locale]/(main)/posts/why-you-cant-call-usestate-inside-useeffect/page.tsx` | Same |
| `src/app/[locale]/(main)/posts/page.tsx` | Replaced by `/blog` listing page |

## Does NOT Build

- ❌ Post editor / Tiptap WYSIWYG (deferred — admin feature)
- ❌ Comments (Phase 5)
- ❌ Bookmarks (Phase 6)
- ❌ Draft management UI (admin feature)
- ❌ Image upload (deferred)

## Contracts

### Types (`src/features/blog/types/index.ts`)

```typescript
import type { Post as PrismaPost, Tag as PrismaTag } from "@/generated/prisma/client";

/** Lightweight tag shape used across UI. */
export type Tag = Pick<PrismaTag, "id" | "name" | "slug">;

/** Full post with tags resolved. Used on post detail page. */
export type PostWithTags = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  readingTime: string;       // pre-computed in service layer
};

/** Lightweight post for list views. Includes content for reading-time calc. */
export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;           // included so readingTime can be computed
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  readingTime: string;       // pre-computed: estimateReadingTime(content)
};

export type CreatePostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  published?: boolean;
  tagIds?: string[];
};

export type UpdatePostInput = Partial<CreatePostInput>;
```

> **Critical fix:** `PostSummary` INCLUDES `content` and `readingTime`. The original Phase 4 prompt had a bug where `PostSummary` excluded `content`, then the PostCard component tried to compute reading time from it. The service layer now computes `readingTime` before returning, so the card never needs the raw content.

### Post Service (`src/features/blog/server/post-service.ts`)

```typescript
// All functions are async, return typed results, and compute readingTime.

export async function getPublishedPosts(): Promise<PostSummary[]>
// Returns published posts, newest first. Reading time pre-computed.

export async function getPostBySlug(slug: string): Promise<PostWithTags | null>
// Single post by slug. Includes full content + tags.

export async function createPost(input: CreatePostInput): Promise<PostWithTags>
// Creates post, connects tags via PostTag join table.

export async function getPostsByTag(tagSlug: string): Promise<PostSummary[]>
// Published posts filtered by tag slug.
```

> **Schema note:** Posts use explicit `PostTag` join table (not implicit m2m). The service layer resolves tags: `db.post.findMany({ include: { tags: { include: { tag: true } } } })` then maps to the flat `Tag[]` shape.

### `<PostCard>` — blog list item

```typescript
import { PostCard } from "@/features/blog/components";

<PostCard post={post} />  // post: PostSummary
```

**Visual structure:**
```
┌─ Card ──────────────────────────────────────┐
│  [Badge] [Badge]                  ← tags     │
│  Post Title                       ← title    │
│  Excerpt text goes here...        ← excerpt  │
│  Jul 28, 2026 · 5 min read        ← meta     │
└──────────────────────────────────────────────┘
```

- Uses `<Card>` + `<CardContent>` from Phase 0
- Tags rendered as `<Badge variant="secondary">`
- Entire card is a `<Link>` to `/blog/{slug}`
- Date formatted via `Intl.DateTimeFormat`

### `<PostHeader>` — post detail header

```typescript
import { PostHeader } from "@/features/blog/components";

<PostHeader post={post} />  // post: PostWithTags
```

- Tags as `<Badge>` linking to `/blog/tag/{slug}`
- Title as `<h1>`
- Excerpt as subtitle
- Meta row: date · reading time

### Route Paths

| Path | Type | Purpose |
|------|------|---------|
| `/[locale]/blog` | Server Component | List published posts |
| `/[locale]/blog/[slug]` | Server Component | Single post detail |
| `/[locale]/blog/tag/[slug]` | Server Component | Posts filtered by tag |
| `/api/posts` | Route Handler | GET (list), POST (create) |
| `/api/posts/[id]` | Route Handler | GET, PUT, DELETE |

**Redirect:** `/posts/*` → `/blog/*` (configured in `next.config.js`)

### API Response Format

All API routes use Phase 1's helpers:

```typescript
// List
return apiSuccess(posts);

// Single
return post
  ? apiSuccess(post)
  : apiError("Post not found", { status: 404 });

// Create
return apiSuccess(newPost, { status: 201 });
```

## Implementation Steps

### Step 1: Create types

Create `src/features/blog/types/index.ts` per the Contracts above.

### Step 2: Create reading-time utility

`src/features/blog/lib/reading-time.ts` — strips HTML, counts words, divides by 238 WPM.

### Step 3: Create post service

`src/features/blog/server/post-service.ts`:
- `SUMMARY_SELECT` const — Prisma select shape for list views
- `FULL_SELECT` const — includes `content`
- All CRUD functions compute `readingTime` before returning
- Handles `PostTag` join table → flat `Tag[]` mapping

### Step 4: Create components

- `post-card.tsx` — uses `<Card>`, `<Badge>`, `<Link>`
- `post-header.tsx` — uses `<Badge>`, styled header
- `index.ts` — barrel exports

### Step 5: Create pages

- `blog/page.tsx` — calls `getPublishedPosts()`, renders `<PostCard>` list
- `blog/[slug]/page.tsx` — calls `getPostBySlug()`, renders `<PostHeader>` + content
  - `generateStaticParams()` for SSG
  - `generateMetadata()` for SEO
- `blog/tag/[slug]/page.tsx` — calls `getPostsByTag()`

### Step 6: Create API routes

- `api/posts/route.ts` — GET (list) + POST (create with validation)
- `api/posts/[id]/route.ts` — GET + PUT + DELETE

### Step 7: Write seed script

`prisma/seed.ts`:
- Extracts content from the 3 existing static post `.tsx` files
- Creates `Post` records + `Tag` records + `PostTag` joins
- Run with: `npx prisma db seed`

Add to `package.json`:
```json
{ "prisma": { "seed": "tsx prisma/seed.ts" } }
```

Install `tsx`: `npm install -D tsx`

### Step 8: Delete static posts + add redirect

- Delete `src/app/[locale]/(main)/posts/` directory
- Add redirect in `next.config.js`:
  ```js
  async redirects() {
    return [
      { source: "/posts/:slug*", destination: "/blog/:slug*", permanent: true },
      { source: "/posts", destination: "/blog", permanent: true },
    ];
  }
  ```

### Step 9: Verify

```bash
npx prisma db seed    # seed existing posts to DB
npx tsc --noEmit
npm run build
```

---

## Verification Checklist

- [ ] `getPublishedPosts()` returns seeded posts with `readingTime` computed
- [ ] `/blog` shows post cards using `<Card>` + `<Badge>`
- [ ] `/blog/networking-101` renders full post content
- [ ] `/blog/tag/networking` shows filtered posts
- [ ] `/posts/networking-101` redirects to `/blog/networking-101`
- [ ] Static `.tsx` post files are deleted
- [ ] API `GET /api/posts` returns `apiSuccess` format
- [ ] `generateMetadata` produces correct `<title>` + OG tags
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds

---

## Pitfalls

1. **PostTag join table** — Prisma queries must `include: { tags: { include: { tag: true } } }` then map `post.tags.map(pt => pt.tag)`. The service layer handles this; components receive flat `Tag[]`.
2. **Reading time computed in service** — Never in the component. The service computes `estimateReadingTime(post.content)` and attaches it as `post.readingTime` before returning.
3. **Content is HTML** — Post content stored as HTML string. Rendered via `dangerouslySetInnerHTML` inside `.prose-memoir`. Safe because only admin-authored content enters the DB.
4. **Slug uniqueness** — `@unique` on `slug` means `createPost` will throw on duplicate. API route should catch `P2002` and return 409.
5. **Seed script needs DB** — Must have `.env` + `prisma migrate dev` run before seeding.

---

*Phase 4 complete. Next: [Phase 5 — Comments](./05-comments.md)*
