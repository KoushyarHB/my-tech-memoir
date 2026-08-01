# Phase 8: Polish & Production Readiness

> **Status:** ⏳ PLANNED
> **Prerequisites:** Phase 0-7 complete
> **Goal:** Add production-grade error handling, loading states, ESLint setup, and final SEO pass.

---

## Consumes

- `<Skeleton>` from `@/components/ui/skeleton` (Phase 0)
- `<Spinner>` from `@/components/ui/spinner` (Phase 0)
- `<Button>` from `@/components/ui/button` (Phase 0)
- `<Container>` from `@/components/layout` (Phase 0)
- `lucide-react` icons (Phase 0)
- Existing theme system (Phase 2)
- All pages from Phases 3-7

## Produces

### Files Created

| File | Description |
|------|-------------|
| `src/app/not-found.tsx` | Custom 404 page (Server Component) |
| `src/app/global-error.tsx` | Global error boundary (Client Component, own `<html>`) |
| `src/app/[locale]/(main)/error.tsx` | Route-segment error boundary |
| `src/app/loading.tsx` | Root loading spinner |
| `src/app/[locale]/(main)/blog/loading.tsx` | Blog list skeleton |
| `src/app/[locale]/(main)/blog/[slug]/loading.tsx` | Post detail skeleton |
| `eslint.config.mjs` | ESLint flat config (Next.js 16 compatible) |

### Files Modified

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Enhanced metadata (OG, Twitter, template) |
| `package.json` | Add `eslint`, `eslint-config-next` devDeps, fix `lint` script |

## Does NOT Build

- ❌ New features (polish phase only)
- ❌ Analytics integration (Vercel Analytics — user adds post-deploy)
- ❌ Performance monitoring (deferred)
- ❌ E2E tests (separate effort)

## Contracts

### Error boundaries

```typescript
// not-found.tsx — Server Component, no "use client"
// Renders: 404 heading + "Return home" link
// Uses: <Button asChild><Link href="/">← Return home</Link></Button>

// global-error.tsx — Client Component ("use client")
// MUST have own <html> and <body> — replaces root layout on error
// Uses hardcoded colors (theme provider may have crashed)
// Has "Try again" button calling reset()

// [locale]/(main)/error.tsx — Client Component
// Catches segment-level errors
// Shows error.message in dev, generic in prod
// Uses design tokens (theme provider still active)
```

### Loading states

```typescript
// loading.tsx files use Next.js App Router convention
// They display automatically while route segment streams

// Root loading: <Spinner /> centered
// Blog loading: <Skeleton> placeholders matching <PostCard> layout
// Post detail loading: <Skeleton> placeholders matching article layout
```

### ESLint setup

```javascript
// eslint.config.mjs (flat config — Next.js 16 requires this, not .eslintrc)
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [...compat.extends("next/core-web-vitals", "next/typescript")];
```

```json
// package.json scripts
{
  "lint": "eslint ."
}
```

## Implementation Steps

### Step 1: Set up ESLint (fixes broken `npm run lint`)

```bash
npm install -D eslint eslint-config-next @eslint/eslintrc
```

Create `eslint.config.mjs` with flat config. Update `package.json` `lint` script from `next lint` (deprecated in Next 16) to `eslint .`.

### Step 2: Create 404 page

`src/app/not-found.tsx` — Server Component. Large "404" in serif, message, `<Button asChild>` with `<Link href="/">`.

### Step 3: Create global error boundary

`src/app/global-error.tsx` — Client Component. Own `<html>`/`<body>`. Hardcoded dark theme colors (theme provider may be unavailable). `reset()` button.

### Step 4: Create route error boundary

`src/app/[locale]/(main)/error.tsx` — Client Component. Uses design tokens (theme provider active at segment level). Shows `error.message` in dev only.

### Step 5: Create loading states

- `src/app/loading.tsx` — centered `<Spinner />`
- `src/app/[locale]/(main)/blog/loading.tsx` — `<Skeleton>` cards matching PostCard layout
- `src/app/[locale]/(main)/blog/[slug]/loading.tsx` — `<Skeleton>` matching article layout

### Step 6: Enhance root metadata

Update `src/app/layout.tsx` metadata:
- Add `metadataBase` from `NEXT_PUBLIC_SITE_URL`
- Add `openGraph.locale`
- Add `twitter.card: "summary_large_image"`
- Verify title template works: `%s | My Tech Memoir`

### Step 7: Final verification

```bash
npm run lint          # must pass with zero warnings
npx tsc --noEmit      # must pass
npm run build         # must succeed
```

Manual checks:
- Visit `/nonexistent` → 404 page renders
- Visit `/blog` → skeleton flashes then content
- Toggle theme on all pages → no flash
- Check mobile responsive at 375px
- Check meta tags in page source

---

## Verification Checklist

### Build & Lint
- [ ] `npm run lint` passes (now using ESLint flat config, not `next lint`)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds with zero errors

### Error Handling
- [ ] Custom 404 page renders on unknown routes
- [ ] Global error boundary catches layout crashes
- [ ] Segment error boundary catches page errors
- [ ] Error pages have "Try again" / "Return home" buttons

### Loading States
- [ ] Root loading spinner appears during initial load
- [ ] Blog list skeleton appears during data fetch
- [ ] Post detail skeleton appears during data fetch
- [ ] Skeletons use `<Skeleton>` from Phase 0

### SEO
- [ ] All pages have `<title>` tags
- [ ] Root layout has `metadataBase`
- [ ] Open Graph tags present
- [ ] Twitter card metadata present

### Accessibility
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] All interactive elements keyboard-navigable
- [ ] Theme toggle has `aria-label`
- [ ] Loading spinners have `role="status"`
- [ ] Images have `alt` text

### Responsive
- [ ] Mobile (375px) — no horizontal scroll
- [ ] Tablet (768px) — layout adapts
- [ ] Desktop (1280px) — centered max-width

---

## Pitfalls

1. **`global-error.tsx` must have own `<html>`/`<body>`** — it replaces the root layout entirely. No `<Header>`, `<Footer>`, or providers available.
2. **Do NOT import `@/components/` in `global-error.tsx`** — they depend on providers that may have crashed.
3. **`loading.tsx` must be lightweight** — heavy loading UI defeats the purpose of streaming.
4. **ESLint flat config is required for Next.js 16** — `.eslintrc.json` no longer works. Use `eslint.config.mjs`.
5. **`next lint` is deprecated in Next.js 16** — the `lint` script must use `eslint .` directly.

---

*Phase 8 complete. The project is production-ready.*

---

## Post-Deployment Checklist

- [ ] Vercel deployment succeeds
- [ ] Environment variables set in Vercel (`DATABASE_URL`, `AUTH_SECRET`, etc.)
- [ ] `AUTH_SECRET` generated (`npx auth secret`)
- [ ] OAuth callback URLs updated for production domain
- [ ] Vercel Analytics enabled (optional)
- [ ] Custom domain configured (optional)
