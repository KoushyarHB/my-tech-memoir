# Phase 7: Home & About

> **Status:** ⏳ PLANNED
> **Prerequisites:** Phase 0-6 complete (especially Phase 4 blog components)
> **Goal:** Replace the hardcoded home page with a DB-driven page showing recent posts. Create an About page with bio, skills, social links, and contact.

---

## Consumes

- `<PostCard>` from `@/features/blog/components` (Phase 4) — **contract: accepts `PostSummary`**
- `getPublishedPosts` from `@/features/blog/server/post-service` (Phase 4)
- `<Card>`, `<Badge>`, `<Button>` from `@/components/ui/*` (Phase 0)
- `<Container>`, `<Section>`, `<PageHeader>` from `@/components/layout` (Phase 0)
- `db` from `@/lib/db` (Phase 1)
- Icons from `lucide-react` (Phase 0): `Github`, `Linkedin`, `Mail`, `ArrowRight`

## Produces

### Files Modified/Created

| File | Action | Description |
|------|--------|-------------|
| `src/app/[locale]/(main)/page.tsx` | **Replace** | DB-driven home with hero + recent posts |
| `src/app/[locale]/(main)/about/page.tsx` | **Create** | About page with bio, skills, social, contact |
| `public/images/author.jpg` | **Create** | Placeholder image (user replaces later) |

## Does NOT Build

- ❌ New components (this phase is pure composition of existing primitives)
- ❌ New API routes
- ❌ New database queries beyond `getPublishedPosts` (already in Phase 4)
- ❌ Contact form backend (just a `mailto:` link)

## Contracts

### Home Page

```typescript
// src/app/[locale]/(main)/page.tsx

// Fetches: 5 most recent published posts
// Renders:
//   <Container>
//     <PageHeader title="My Tech Memoir" description="..." />
//     <Section aria-label="Recent posts">
//       {posts.map(post => <PostCard key={post.id} post={post} />)}
//       <Link href="/blog">View All Posts →</Link>
//     </Section>
//   </Container>

// Empty state when no posts: "No posts published yet."
```

> **Key fix:** Home page consumes `<PostCard>` from Phase 4. No duplicate post-card markup. The `PostSummary` type from Phase 4 flows directly from `getPublishedPosts()` to `<PostCard post={...} />`.

### About Page

```typescript
// src/app/[locale]/(main)/about/page.tsx

// Static content page (no DB queries):
//   <Container>
//     <figure> — author photo (circular, 160px, <Avatar> or plain <img>)
//     <PageHeader title="About" />
//     <Section aria-label="Bio"> — multi-paragraph bio in .prose-memoir
//     <Section aria-label="Skills"> — grid of <Badge variant="secondary">
//     <Section aria-label="Social links"> — icon+text rows with lucide icons
//     <Section aria-label="Contact"> — <Button> with mailto: link
//   </Container>
```

### Route Paths

| Path | Type | Purpose |
|------|------|---------|
| `/[locale]` | Server Component | Home page |
| `/[locale]/about` | Server Component | About page |

### Metadata

Both pages export static `metadata` objects (no `generateMetadata` needed — no dynamic params):

```typescript
export const metadata: Metadata = {
  title: "My Tech Memoir — Networking & Protocols",
  description: "...",
  openGraph: { type: "website", ... },
};
```

## Implementation Steps

### Step 1: Replace home page

`src/app/[locale]/(main)/page.tsx`:
- Import `getPublishedPosts` from Phase 4
- Import `<PostCard>` from Phase 4
- Import `<Container>`, `<PageHeader>`, `<Section>` from Phase 0
- Query: `const posts = await db.post.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 5 })`
- Or use `getPublishedPosts()` and slice to 5
- Render hero + PostCard list + "View All Posts" link

### Step 2: Create about page

`src/app/[locale]/(main)/about/page.tsx`:
- Static content with placeholder bio text
- Skills as `<Badge variant="secondary">` grid
- Social links using `lucide-react` icons (`Github`, `Linkedin`, `Mail`)
- Contact button as `<Button asChild><Link href="mailto:...">Get in Touch</Link></Button>`

### Step 3: Create placeholder author image

Place a 1x1 pixel or simple placeholder at `public/images/author.jpg`.

### Step 4: Verify

```bash
npx tsc --noEmit
npm run build
```

---

## Verification Checklist

- [ ] Home page queries DB and shows recent published posts
- [ ] Empty state shows when no posts exist
- [ ] "View All Posts" link goes to `/blog`
- [ ] Post cards reuse `<PostCard>` from Phase 4 (no duplicate markup)
- [ ] About page renders with photo, bio, skills, social, contact sections
- [ ] Skills use `<Badge variant="secondary">`
- [ ] Social links use lucide icons
- [ ] Contact button uses `<Button>`
- [ ] Both pages have correct metadata
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds

---

## Pitfalls

1. **Do NOT create a new PostCard** — consume `<PostCard>` from `@/features/blog/components`. The `PostSummary` type flows directly.
2. **Use `/blog` paths** — not `/posts`. Phase 4 standardized on `/blog`. All links point to `/blog/[slug]`.
3. **Static metadata is fine** — these pages have no dynamic params. No `generateMetadata()` needed.
4. **Placeholder content** — Bio, skills, and social URLs are placeholders. Mark with comments for user to customize.

---

*Phase 7 complete. Next: [Phase 8 — Polish](./08-polish.md)*
