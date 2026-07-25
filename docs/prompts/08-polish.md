# Phase 8: Polish & Final Touches

> **Project:** my-tech-memoir — Next.js 16 (App Router) + React 19 + Prisma 7 + Neon + Tailwind 4 + shadcn/ui
> **Prerequisite:** Phases 1–7 complete. All features (blog CRUD, comments, bookmarks, auth, homepage, about page) are functional.
> **Goal:** Add production-grade error handling, loading UX, and run a final verification pass to ensure the site is ready for deployment.

---

## Overview

This phase polishes the app from "working" to "production-ready." You will create custom error pages, loading states, a React error boundary, Suspense wrappers, and then run through a final checklist to verify everything compiles, renders, and behaves correctly.

---

## Conventions

- **Path alias:** `@/*` → `./src/*`
- **Styling:** Use the existing CSS custom properties (`var(--bg-base)`, `var(--ink-primary)`, `var(--accent)`, etc.) defined in `src/app/globals.css`. Use inline `style` props for token references and Tailwind classes for layout/spacing.
- **Theme:** The `ThemeProvider` wraps the app in `src/app/layout.tsx`. Use `useTheme()` from `@/components/theme` in client components for theme-aware behavior.
- **Components:** Server components by default. Add `"use client"` only when using hooks, event handlers, or browser APIs.
- **No new dependencies.** Everything in this phase uses existing packages and the Next.js/React built-in APIs.

---

## Task 1: Custom 404 Page

**File:** `src/app/not-found.tsx`

Create a styled 404 page that matches the site's design language. This file is the App Router convention for handling 404 responses.

### Requirements

1. **Server component** (no `"use client"` needed).
2. Center the content vertically and horizontally in the `<main>` area.
3. Display:
   - A large "404" heading using the serif font family.
   - A short message: "This page could not be found."
   - A link back to the homepage ("← Return home").
4. Use the existing design tokens for colors and typography.
5. The link should use `next/link` `<Link>` component with the `@/` path alias.

### Implementation

```tsx
// src/app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
      <h1
        className="font-serif text-7xl font-bold tracking-tight"
        style={{ color: 'var(--ink-tertiary)' }}
      >
        404
      </h1>
      <p
        className="mt-4 text-lg"
        style={{ color: 'var(--ink-secondary)' }}
      >
        This page could not be found.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: 'var(--accent)' }}
      >
        ← Return home
      </Link>
    </div>
  )
}
```

### Verification

- Navigate to any non-existent route (e.g., `/does-not-exist`) in the browser.
- Confirm the 404 page renders with the correct styling.
- Confirm the "Return home" link navigates back to `/`.

---

## Task 2: Global Error Boundary

**File:** `src/app/global-error.tsx`

The App Router `global-error.tsx` catches errors that crash the entire layout (including the root layout itself). This is the safety net for uncaught exceptions.

### Requirements

1. **Must be a client component** — add `"use client"` at the top.
2. Must render its own `<html>` and `<body>` tags (it replaces the root layout on error).
3. Display a friendly error message with a button to reload the page.
4. Style consistently with the site's dark theme defaults (since theme state may be lost during an error).

### Implementation

```tsx
// src/app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          backgroundColor: '#0d1117',
          color: '#e6edf3',
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1
            style={{
              fontFamily: "'Lora', Georgia, ui-serif, serif",
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: '#8b949e',
              marginBottom: '2rem',
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#e6edf3',
              backgroundColor: '#8baed6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
```

### Key Notes

- This component uses hardcoded dark theme colors (`#0d1117`, `#e6edf3`) because the `ThemeProvider` context may be unavailable when this boundary fires.
- The `reset()` callback re-renders the root layout, giving the app a chance to recover.
- Do **not** import any components from `@/components/` here — they may depend on providers that crashed.

---

## Task 3: Route-Level Error Boundary

**File:** `src/app/(blog)/error.tsx`

In addition to the global error boundary, create a route-segment error boundary for the blog section. This catches errors within the blog layout without crashing the entire app.

### Requirements

1. **Must be a client component** — `"use client"`.
2. Show the error message (in development) and a generic message (in production).
3. Include a "Try again" button using the `reset` prop.
4. Style with inline styles referencing design tokens (the theme provider may still be up for segment-level errors).

### Implementation

```tsx
// src/app/(blog)/error.tsx
'use client'

import { useEffect } from 'react'

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to your error reporting service in production
    console.error('[Blog Error]', error)
  }, [error])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center"
      style={{ color: 'var(--ink-primary)' }}
    >
      <h2
        className="font-serif text-2xl font-semibold"
        style={{ color: 'var(--ink-primary)' }}
      >
        Something went wrong
      </h2>
      <p
        className="mt-3 text-sm"
        style={{ color: 'var(--ink-secondary)' }}
      >
        An error occurred loading this content. Please try again.
      </p>
      {process.env.NODE_ENV === 'development' && error.message && (
        <pre
          className="mt-4 max-w-lg text-xs text-left overflow-auto p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--code-bg)',
            border: '1px solid var(--code-border)',
            color: 'var(--code-text)',
          }}
        >
          {error.message}
        </pre>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 px-5 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-colors"
        style={{
          color: 'var(--ink-primary)',
          backgroundColor: 'var(--bg-muted)',
          border: '1px solid var(--border)',
        }}
      >
        Try again
      </button>
    </div>
  )
}
```

---

## Task 4: Loading States

Create loading UI for routes that fetch data. Next.js App Router uses `loading.tsx` convention files that display automatically while a route segment is loading.

### 4a. Global Loading (Root Segment)

**File:** `src/app/loading.tsx`

A subtle full-page loading indicator shown while the root layout is streaming.

```tsx
// src/app/loading.tsx
export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-6 h-6 rounded-full animate-spin"
        style={{
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
        }}
        aria-label="Loading"
        role="status"
      />
    </div>
  )
}
```

### 4b. Blog Loading

**File:** `src/app/(blog)/loading.tsx`

A skeleton placeholder matching the blog post layout while posts are being fetched.

```tsx
// src/app/(blog)/loading.tsx
export default function BlogLoading() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      {/* Skeleton: title */}
      <div
        className="h-8 w-3/4 rounded-md animate-pulse mb-4"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      />
      {/* Skeleton: meta line */}
      <div
        className="h-4 w-1/4 rounded-md animate-pulse mb-8"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      />
      {/* Skeleton: paragraphs */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mb-4">
          <div
            className="h-4 w-full rounded-md animate-pulse mb-2"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          />
          <div
            className="h-4 w-5/6 rounded-md animate-pulse"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          />
        </div>
      ))}
    </div>
  )
}
```

### 4c. Individual Post Loading

**File:** `src/app/(blog)/[slug]/loading.tsx`

A skeleton matching the blog post detail layout.

```tsx
// src/app/(blog)/[slug]/loading.tsx
export default function PostLoading() {
  return (
    <article className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      {/* Skeleton: title */}
      <div
        className="h-10 w-4/5 rounded-md animate-pulse mb-3"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      />
      {/* Skeleton: date */}
      <div
        className="h-4 w-1/5 rounded-md animate-pulse mb-8"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      />
      {/* Skeleton: body */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="mb-4">
          <div
            className="h-4 w-full rounded-md animate-pulse mb-2"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          />
          <div
            className="h-4 w-3/4 rounded-md animate-pulse"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          />
        </div>
      ))}
    </article>
  )
}
```

### Design Notes

- The spin animation relies on Tailwind's built-in `animate-spin` class.
- The pulse skeleton relies on Tailwind's built-in `animate-pulse` class.
- Both are available in Tailwind 4 with zero configuration.
- The skeleton colors use `var(--bg-muted)` so they automatically adapt to light/dark theme.

---

## Task 5: Suspense Boundaries

Wrap async data-fetching components in `<Suspense>` so partial content streams in progressively instead of blocking the entire page.

### 5a. Post List with Suspense

Wrap the post list component in a Suspense boundary within the blog index page. This lets the shell (header, footer, page chrome) render immediately while posts load.

**File:** `src/app/(blog)/page.tsx`

```tsx
// src/app/(blog)/page.tsx
import { Suspense } from 'react'
import { PostList } from '@/components/PostList'
import BlogLoading from './loading'

export default function BlogIndexPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <h1
        className="font-serif text-3xl font-bold tracking-tight mb-8"
        style={{ color: 'var(--ink-primary)' }}
      >
        Blog
      </h1>
      <Suspense fallback={<BlogLoading />}>
        <PostList />
      </Suspense>
    </div>
  )
}
```

### 5b. Post Detail with Suspense

Wrap async parts of the post detail page (e.g., comments section, related posts) in Suspense so the article body renders first.

**File:** `src/app/(blog)/[slug]/page.tsx`

```tsx
// src/app/(blog)/[slug]/page.tsx
import { Suspense } from 'react'
import { CommentsSection } from '@/components/CommentsSection'

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ... fetch post data, render article body ...

  return (
    <article className="max-w-2xl mx-auto px-5 py-10 sm:py-14 prose-memoir">
      {/* Article body renders immediately */}
      {/* ... */}

      {/* Comments stream in separately */}
      <Suspense
        fallback={
          <div className="mt-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
            <p className="text-sm">Loading comments…</p>
          </div>
        }
      >
        <CommentsSection postId={post.id} />
      </Suspense>
    </article>
  )
}
```

### When to Use Suspense vs. Loading Files

| Pattern | Use When |
|---------|----------|
| `loading.tsx` | The **entire** route segment is async. Shows skeleton while anything in that segment streams. |
| `<Suspense>` | You want **partial streaming** — some content renders immediately, async parts load inside the boundary. |

Use `loading.tsx` for top-level route transitions. Use `<Suspense>` for finer-grained control within a page.

---

## Task 6: Metadata & SEO Polish

Ensure the root layout has comprehensive metadata and that key pages export proper metadata.

### 6a. Enhanced Root Metadata

**File:** `src/app/layout.tsx`

Update the metadata export in the existing root layout:

```tsx
export const metadata: Metadata = {
  title: {
    default: 'My Tech Memoir — Networking & Protocols',
    template: '%s | My Tech Memoir',
  },
  description:
    'A personal technical memoir exploring networking, protocols, and how the internet works — written as it was learned.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://my-tech-memoir.vercel.app'
  ),
  openGraph: {
    title: 'My Tech Memoir',
    description:
      'A personal technical memoir exploring networking, protocols, and how the internet works.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
}
```

### 6b. Blog Post Metadata

Each blog post page should export dynamic metadata:

```tsx
// Inside src/app/(blog)/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  // Fetch post from DB
  // const post = await getPost(slug)

  return {
    title: post.title,
    description: post.excerpt || `Read "${post.title}" on My Tech Memoir.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      type: 'article',
    },
  }
}
```

---

## Task 7: Final Verification Checklist

After all files are in place, run through this checklist to confirm everything is production-ready.

### Build & Compile

```bash
# 1. Clean build — must succeed with zero errors
npm run build

# 2. Type checking — must pass with zero errors
npx tsc --noEmit

# 3. Linting — must pass with zero errors
npm run lint
```

### Manual Verification

| # | Check | Expected |
|---|-------|----------|
| 1 | Visit `/` (homepage) | Renders correctly, no console errors |
| 2 | Visit `/blog` | Post list loads with skeleton → content |
| 3 | Visit `/blog/[valid-slug]` | Post detail renders, comments load in Suspense |
| 4 | Visit `/about` | About page renders correctly |
| 5 | Visit `/nonexistent-route` | Custom 404 page renders with "Return home" link |
| 6 | Click "Return home" on 404 | Navigates to `/` |
| 7 | Toggle theme (dark/light) | All pages respect the theme, no flash of wrong color |
| 8 | Sign in / Sign out | Auth flow works, session persists across navigation |
| 9 | Bookmark a post | Bookmark toggles correctly, persists |
| 10 | Scroll a long post | Reading progress indicator updates |
| 11 | Reload any page | No hydration mismatch warnings in console |
| 12 | Check mobile viewport (375px) | Layout is responsive, no horizontal scroll |
| 13 | Check `loading.tsx` skeletons | Appear briefly during navigation, then replaced by content |
| 14 | Check `<Suspense>` boundaries | Comments/async parts stream in after main content |
| 15 | Check meta tags (View Source) | Title, description, OG tags present |

### Performance Checks

| # | Check | How |
|---|-------|-----|
| 1 | No client-side waterfalls | Verify data fetching happens in server components where possible |
| 2 | Image optimization | Any `<img>` tags use `next/image` with proper sizing |
| 3 | Font loading | Fonts load via `@import` or `next/font` — no layout shift |
| 4 | Bundle size | Run `npm run build` and check `.next/analyze` output if available |

### Accessibility Checks

| # | Check | How |
|---|-------|-----|
| 1 | Heading hierarchy | h1 → h2 → h3, no skipped levels |
| 2 | Link text | All links have descriptive text (no "click here") |
| 3 | Color contrast | Text meets WCAG AA (4.5:1 for normal text) |
| 4 | Focus indicators | All interactive elements are keyboard-navigable |
| 5 | ARIA labels | Theme toggle, loading spinners, and interactive elements have `aria-label` |
| 6 | Semantic HTML | Use `<article>`, `<nav>`, `<main>`, `<footer>` correctly |

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/not-found.tsx` | **Create** | Custom 404 page |
| `src/app/global-error.tsx` | **Create** | Global error boundary (wraps root layout) |
| `src/app/(blog)/error.tsx` | **Create** | Blog segment error boundary |
| `src/app/loading.tsx` | **Create** | Root loading spinner |
| `src/app/(blog)/loading.tsx` | **Create** | Blog index skeleton |
| `src/app/(blog)/[slug]/loading.tsx` | **Create** | Blog post detail skeleton |
| `src/app/(blog)/page.tsx` | **Create/Update** | Blog index with Suspense wrapper |
| `src/app/(blog)/[slug]/page.tsx` | **Create/Update** | Blog post detail with Suspense + metadata |
| `src/app/layout.tsx` | **Update** | Enhanced metadata with template + OG tags |

---

## Pitfalls

1. **`global-error.tsx` must have its own `<html>` and `<body>`.** It replaces the entire root layout when it fires. If you forget these tags, the page renders nothing.

2. **Do NOT import `@/components/` in `global-error.tsx`.** Those components depend on providers (ThemeProvider, etc.) that may be the source of the crash. Use only inline styles with hardcoded colors.

3. **`loading.tsx` files must be minimal.** They render *inside* the layout shell but *before* the page content. Keep them lightweight — heavy loading UI defeats the purpose.

4. **Suspense boundaries need a `fallback`.** Without a fallback, React shows nothing while waiting. Always provide meaningful loading UI.

5. **`params` is a `Promise` in Next.js 16.** Always `await params` in page components. The `generateMetadata` function also receives `params` as a Promise.

6. **`metadataBase` is required for relative OG URLs.** Without it, Open Graph images and canonical URLs won't resolve correctly.

7. **Don't over-Suspense.** Wrap only truly async parts. Wrapping static content in Suspense adds overhead for no benefit.

---

## Done Criteria

- [ ] `npm run build` succeeds with zero errors
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] Custom 404 page renders on unknown routes
- [ ] Global error boundary catches layout crashes
- [ ] Blog error boundary catches segment crashes
- [ ] Loading skeletons appear during data fetching
- [ ] Suspense boundaries enable progressive streaming
- [ ] All pages have correct metadata (title, description, OG tags)
- [ ] Theme toggle works across all new pages
- [ ] Mobile responsive at 375px viewport
- [ ] No hydration warnings in browser console
- [ ] Keyboard navigation works on all interactive elements
