# Phase 7: Home & About Pages

## Goal

Replace the current hardcoded home page with a dynamic, data-driven homepage that shows recent blog posts and a personal intro. Add a new `/about` page with author photo, bio, skills, social links, and contact information. Both pages must include full SEO metadata via `generateMetadata()`.

---

## Current State

- **Home page** (`src/app/page.tsx`): Hardcoded "Networking 101" article (183 lines). This entire file will be replaced.
- **Layout** (`src/app/layout.tsx`): Root layout with `<Header>`, `<Footer>`, `<ThemeProvider>`. Already exports basic `metadata` and `viewport`.
- **Prisma schema** (`prisma/schema.prisma`): Has `Post` model (title, slug, excerpt, content, published, createdAt, tags) and `Tag` model.
- **DB client** (`src/lib/db.ts`): Singleton Prisma client with Neon adapter. Import via `import { db } from '@/lib/db'`.
- **Design tokens**: CSS variables on `:root` / `.dark` — `--ink-primary`, `--ink-secondary`, `--accent`, `--bg-base`, `--bg-raised`, etc.
- **Typography**: `.prose-memoir` class for article content. Serif headings (Lora), sans body (Inter), mono code (JetBrains Mono).
- **Max width pattern**: `max-w-2xl mx-auto px-5` is used everywhere (Header, Footer, Home).
- **Path aliases**: `@/*` maps to `./src/*`.
- **Fonts**: Loaded via Google Fonts import in `globals.css`.

---

## Requirements

### 1. Home Page — `src/app/page.tsx` (Server Component)

Replace the entire existing file. The home page must:

#### 1a. Hero Section
- Display the site title **"My Tech Memoir"** in serif (`font-serif`) at the top.
- Display a one-line personal intro/description beneath the title.
- The hero should use `var(--ink-primary)` for the title and `var(--ink-secondary)` for the description.
- Keep the layout consistent: `max-w-2xl mx-auto px-5 py-10 sm:py-14`.

#### 1b. Recent Posts Section
- Query the database for the **5 most recent published posts** ordered by `createdAt` descending.
- Use the existing `db` singleton from `@/lib/db`:
  ```ts
  import { db } from '@/lib/db';
  ```
- Prisma query:
  ```ts
  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { tags: true },
  });
  ```
- Render each post as a card-like row with:
  - Post title (linked to `/posts/[slug]` using Next.js `<Link>`)
  - Excerpt (if available)
  - Published date formatted as `MMM d, yyyy` (use a simple `Intl.DateTimeFormat` — do NOT install date-fns)
  - Tag pills (small badges with `--accent` background at low opacity)
- Add a **"View All Posts →"** link at the bottom pointing to `/posts`.
- If there are no published posts yet, show a friendly empty state message.

#### 1c. Layout Details
- Use semantic HTML: `<section>`, `<article>`, `<time>`.
- Style cards with `var(--bg-raised)` background, `var(--border)` border, and a subtle hover state.
- The "View All Posts" link should use `var(--accent)` color with underline, matching the existing `.prose-memoir a` style.
- Cards should have a left accent bar (3px, `var(--accent-muted)`) similar to how `<pre>` blocks are styled.

### 2. About Page — `src/app/about/page.tsx` (Server Component)

Create a new directory `src/app/about/` with a `page.tsx` file.

#### 2a. Author Photo
- Use a placeholder image path: `/images/author.jpg`.
- Place a placeholder file at `public/images/author.jpg` (a 1x1 pixel gray PNG is fine — or note it as TODO for the user).
- Display as a circular image, ~160px diameter, with `var(--accent-muted)` border.
- Wrap in a `<figure>` element.

#### 2b. Bio Section
- Display the author's name in serif heading.
- Display a multi-paragraph bio. Use placeholder text that the user will customize:
  ```tsx
  // Placeholder — user should customize this content
  const bio = [
    "Software engineer with a deep curiosity about how things work under the hood.",
    "Currently exploring networking, protocols, and the architecture of the internet.",
    "This blog is a living document of that exploration — written as I learn.",
  ];
  ```
- Render each paragraph inside the `.prose-memoir` container.

#### 2c. Skills Section
- Display a grid of skill badges/tags.
- Use placeholder data:
  ```tsx
  const skills = [
    "TypeScript", "React", "Next.js", "Node.js",
    "PostgreSQL", "Prisma", "Networking", "Linux",
    "Docker", "Git", "Tailwind CSS", "Python",
  ];
  ```
- Each badge: small rounded pill, `var(--bg-muted)` background, `var(--ink-secondary)` text, `1px solid var(--border)` border.
- Display in a flex-wrap grid layout.

#### 2d. Social Links
- Display social links as icon+text rows. Use inline SVG icons (GitHub, LinkedIn, Twitter/X, Email).
- Use placeholder URLs:
  ```tsx
  const socialLinks = [
    { name: 'GitHub',   url: 'https://github.com/KoushyarHB',  icon: 'github' },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/TODO',   icon: 'linkedin' },
    { name: 'X / Twitter', url: 'https://x.com/TODO',         icon: 'twitter' },
    { name: 'Email',    url: 'mailto:hello@example.com',       icon: 'email' },
  ];
  ```
- Each link should be a clickable row with: SVG icon + label text, using `var(--accent)` on hover.
- Icons should be 20×20, inline SVGs — keep them minimal (simple path-based icons, no icon library).

#### 2e. Contact Section
- A short "Get in Touch" paragraph.
- A `mailto:` link styled as a button using `var(--accent)` background and white text.

#### 2f. Layout
- Center with `max-w-2xl mx-auto px-5 py-10 sm:py-14`.
- Use `.prose-memoir` for body text.
- Use a clear visual hierarchy: photo → name → bio → skills → social → contact.
- Use `<section>` elements with descriptive `aria-label` attributes for accessibility.

### 3. SEO Metadata

#### 3a. Home Page Metadata
Add `generateMetadata()` to `src/app/page.tsx`:

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Tech Memoir — Networking & Protocols',
  description: 'A personal technical memoir exploring how the internet routes data. Written as I learn — networking, protocols, and systems architecture.',
  openGraph: {
    title: 'My Tech Memoir',
    description: 'A personal technical memoir exploring how the internet routes data.',
    type: 'website',
    siteName: 'My Tech Memoir',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Tech Memoir',
    description: 'A personal technical memoir exploring how the internet routes data.',
  },
};
```

Since this is a static page (no dynamic params), export `metadata` as a const object — no need for `generateMetadata()` function.

#### 3b. About Page Metadata
Add to `src/app/about/page.tsx`:

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — My Tech Memoir',
  description: 'Software engineer, curious learner, and the author behind My Tech Memoir. Learn about my journey into networking and systems.',
  openGraph: {
    title: 'About — My Tech Memoir',
    description: 'Software engineer, curious learner, and the author behind My Tech Memoir.',
    type: 'profile',
  },
};
```

#### 3c. Dynamic Route Metadata Pattern
Add a comment block in both pages showing the pattern for future dynamic routes (e.g., blog posts). This serves as documentation for when `generateMetadata()` with params is needed:

```ts
// ─── SEO for Dynamic Routes ────────────────────────────────────
// When adding pages with dynamic params (e.g., /posts/[slug]),
// use generateMetadata() instead of static metadata:
//
// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ slug: string }>;
// }): Promise<Metadata> {
//   const { slug } = await params;
//   const post = await db.post.findUnique({ where: { slug } });
//   if (!post) return { title: 'Not Found' };
//   return {
//     title: `${post.title} — My Tech Memoir`,
//     description: post.excerpt ?? post.title,
//     openGraph: {
//       title: post.title,
//       description: post.excerpt ?? post.title,
//       type: 'article',
//       publishedTime: post.createdAt.toISOString(),
//     },
//   };
// }
```

Place this comment block at the bottom of each page file (outside the component export), so the implementing agent sees it as a reference.

#### 3d. Root Layout Metadata Update
The root `src/app/layout.tsx` already exports metadata. Verify it is sufficient and add `twitter` card info if missing. Do NOT override the root metadata from child pages — child page metadata should include full titles (Next.js merges but child titles override).

### 4. Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/page.tsx` | **Replace** | Dynamic home page with hero, recent posts, view-all link |
| `src/app/about/page.tsx` | **Create** | About page with photo, bio, skills, social, contact |
| `public/images/author.jpg` | **Create** | Placeholder 1×1 gray PNG (note: user replaces with real photo) |

Do NOT modify any other files. The layout, header, footer, theme, and global CSS are already correct.

---

## Implementation Notes

### Styling Rules
- Use **inline `style` objects** for design token values (`var(--ink-primary)`, etc.) — this matches the existing codebase pattern in Header.tsx and Footer.tsx.
- Use **Tailwind classes** for layout, spacing, and responsive utilities (`max-w-2xl`, `mx-auto`, `px-5`, `py-10`, `sm:py-14`, `flex`, `gap-4`, `grid`, etc.).
- Do NOT install any new npm packages. Everything must use built-in APIs.
- Do NOT use `shadcn/ui` components — the project has not installed them yet. Use plain HTML + Tailwind + inline styles.

### Date Formatting
Use `Intl.DateTimeFormat` for dates:
```ts
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
```
Place this as a helper function inside the file that needs it.

### Post Card Styling
Each post card should look like this conceptually:
```
┌─ [3px accent bar] ─────────────────────────────────┐
│  Post Title (link)                    Jan 1, 2026  │
│  Excerpt text goes here, truncated to 2 lines...   │
│  [tag1] [tag2]                                     │
└────────────────────────────────────────────────────┘
```

Key CSS properties for the card container:
- `backgroundColor: 'var(--bg-raised)'`
- `border: '1px solid var(--border)'`
- `borderLeft: '3px solid var(--accent-muted)'`
- `borderRadius: '0 8px 8px 0'`
- `padding: '1.25rem 1.5rem'`
- `transition: 'border-color 150ms ease'`
- On hover: `borderColor: 'var(--accent-muted)'`

### Empty State
When no posts exist, render:
```tsx
<section aria-label="Recent posts">
  <p style={{ color: 'var(--ink-tertiary)' }}>
    No posts published yet. Check back soon.
  </p>
</section>
```

### Accessibility
- Use semantic HTML throughout (`<main>`, `<section>`, `<article>`, `<nav>`, `<figure>`, `<figcaption>`, `<time>`).
- All `<time>` elements must have a `dateTime` attribute with ISO format.
- Social links should have `aria-label` attributes (e.g., `aria-label="GitHub profile"`).
- The about page `<figure>` for the author photo should have a `<figcaption>` with the author's name.
- Add `aria-label` to each `<section>` on the about page.

### TypeScript
- All files must be `.tsx` with no TypeScript errors.
- Use proper types — no `any`.
- The `Post` and `Tag` types come from Prisma generated client. You can type the post variable as:
  ```ts
  type PostWithTags = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
    tags: { id: string; name: string; slug: string }[];
  };
  ```
  Or just let TypeScript infer from the Prisma query result.

---

## Verification Checklist

After implementing, verify:

- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts and both pages render at `/` and `/about`
- [ ] Home page queries the database and shows published posts (or empty state if none)
- [ ] About page renders with all sections (photo, bio, skills, social, contact)
- [ ] All links work (post links, social links, "View All Posts")
- [ ] Both pages have correct `<title>` tags from metadata
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Responsive layout works on mobile and desktop
- [ ] Dark mode and light mode both look correct using design tokens
- [ ] Semantic HTML is used (no `<div>` where `<section>` or `<article>` fits)
- [ ] Accessibility: images have alt text, links have accessible names

---

## Reference: Existing Patterns

Follow these patterns from the existing codebase:

**Design token usage (from Header.tsx):**
```tsx
style={{
  color: 'var(--ink-primary)',
  backgroundColor: 'var(--bg-raised)',
  border: '1px solid var(--border)',
}}
```

**Max-width container (from Header.tsx):**
```tsx
<div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
```

**Link styling (from Header.tsx):**
```tsx
<Link
  href="/"
  className="group flex flex-col gap-0"
  style={{ textDecoration: 'none' }}
>
```

**Prisma singleton import (from lib/db.ts):**
```ts
import { db } from '@/lib/db';
```

**Font classes:**
- Headings: `className="font-serif"`
- Body/labels: `className="font-sans"` (default, can omit)
- Code: `className="font-mono"`

**Accent color link:**
```tsx
<Link
  href="/posts"
  style={{ color: 'var(--accent)' }}
  className="underline underline-offset-2 hover:opacity-80 transition-opacity"
>
  View All Posts →
</Link>
```
