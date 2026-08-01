# Phase 0: Design System

> **Status:** ⏳ PLANNED
> **Prerequisites:** None (this is the foundation)
> **Goal:** Establish the shared UI layer — design tokens, shadcn/ui primitives, layout helpers, and icon system — consumed by every subsequent phase.

---

## Consumes

- Existing `src/app/globals.css` design tokens (already renamed to `--bg-base`, `--ink-primary`, etc. in Phase 1)
- Existing `src/lib/theme.ts` custom theme system (kept as-is — NOT replaced)
- Existing `src/components/theme/*` ThemeProvider, ThemeScript, useTheme (kept as-is)

## Produces

### Files Created

| File | Exports |
|------|---------|
| `src/lib/utils.ts` | `cn(...inputs)` — clsx + tailwind-merge |
| `src/components/ui/button.tsx` | `<Button variant size asChild>` — 6 variants, 4 sizes |
| `src/components/ui/card.tsx` | `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>` |
| `src/components/ui/input.tsx` | `<Input>` — styled text input |
| `src/components/ui/label.tsx` | `<Label>` — styled label (Radix Label) |
| `src/components/ui/badge.tsx` | `<Badge variant>` — 4 variants |
| `src/components/ui/textarea.tsx` | `<Textarea>` — styled textarea |
| `src/components/ui/avatar.tsx` | `<Avatar>`, `<AvatarImage>`, `<AvatarFallback>` (Radix Avatar) |
| `src/components/ui/separator.tsx` | `<Separator>` (Radix Separator) |
| `src/components/ui/skeleton.tsx` | `<Skeleton>` — pulse placeholder |
| `src/components/ui/spinner.tsx` | `<Spinner>` — loading spinner |
| `src/components/layout/container.tsx` | `<Container size>` — max-width wrapper |
| `src/components/layout/section.tsx` | `<Section>` — semantic section wrapper |
| `src/components/layout/page-header.tsx` | `<PageHeader title description>` |
| `src/components/layout/index.ts` | Barrel re-exports |

### Files Modified

| File | Changes |
|------|---------|
| `src/app/globals.css` | Add shadcn token alias layer + `@theme inline` block + `tw-animate-css` import |
| `src/components/Header.tsx` | Replace inline-styled buttons with `<Button>`, `<Avatar>`, lucide icons |
| `src/components/Footer.tsx` | No changes in Phase 0 (social links added in Phase 3) |
| `src/features/auth/components/sign-in-buttons.tsx` | Replace inline-styled buttons with `<Button variant="outline">` |
| `src/app/(auth)/signin/page.tsx` | Replace card div with `<Card>` + `<CardHeader>` + `<CardContent>` |
| `src/app/page.tsx` | Replace post card divs with `<Card>` + `<Badge>` |
| `src/app/posts/page.tsx` | Same Card + Badge refactor |
| `src/app/posts/*/page.tsx` | Minimal refactor (wrap prose if applicable, use Badge for inline tags) |

### Dependencies Installed

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label badge textarea avatar separator skeleton spinner

npm install lucide-react tw-animate-css
```

Peer deps auto-installed: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `@radix-ui/react-label`, `@radix-ui/react-avatar`, `@radix-ui/react-separator`.

## Does NOT Build

- ❌ Theme system (keep existing custom `src/lib/theme.ts` + `ThemeProvider` — do NOT install `next-themes`)
- ❌ Header/Footer from scratch (augment existing)
- ❌ Fonts (already handled via `@import` in globals.css — Phase 3 may switch to `next/font`)
- ❌ Page layouts (those belong to Phase 4-7)
- ❌ i18n (Phase 3)

## Contracts

### `cn()` — classname merger

```typescript
import { cn } from "@/lib/utils";

cn("px-4 py-2", condition && "bg-red-500", className)
```

### `<Button>` — variant button

```typescript
import { Button } from "@/components/ui/button";

<Button variant="default|destructive|outline|secondary|ghost|link"
        size="default|sm|lg|icon"
        asChild={boolean}>
  Click me
</Button>
```

| Variant | Light bg | Dark bg | Use case |
|---------|----------|---------|----------|
| `default` | `--accent` (blue) | `--accent` | Primary action (sign in, post comment) |
| `outline` | `--bg-muted` + border | `--bg-muted` + border | Secondary action (sign in with GitHub) |
| `ghost` | transparent | transparent | Icon buttons (theme toggle) |
| `secondary` | `--bg-muted` | `--bg-muted` | Tertiary action (sign out) |
| `link` | transparent + underline | transparent + underline | Inline links |
| `destructive` | red | red | Delete actions |

### `<Card>` — surface container

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
from "@/components/ui/card";

<Card className="max-w-sm">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle text</CardDescription>
  </CardHeader>
  <CardContent>Body</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

Maps to: `backgroundColor: var(--bg-raised)`, `border: 1px solid var(--border)`, `borderRadius: var(--radius)`.

### `<Badge>` — tag pill

```typescript
import { Badge } from "@/components/ui/badge";

<Badge variant="default|secondary|destructive|outline">
  Tag Name
</Badge>
```

Maps to: `secondary` variant uses `var(--bg-muted)` bg + `var(--ink-secondary)` text.

### `<Input>` / `<Textarea>` / `<Label>` — form primitives

```typescript
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="you@example.com" />
<Textarea id="comment" rows={4} />
```

Map to: `var(--bg-base)` bg, `var(--border)` border, `var(--ink-primary)` text.

### `<Avatar>` — user image

```typescript
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src={user.image} alt={user.name} />
  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
</Avatar>
```

### `<Skeleton>` / `<Spinner>` — loading states

```typescript
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

<Skeleton className="h-4 w-3/4" />  // pulse placeholder
<Spinner />                          // animated spinner
```

### `<Container>` / `<Section>` / `<PageHeader>` — layout primitives

```typescript
import { Container, Section, PageHeader } from "@/components/layout";

<Container size="md">    // max-w-2xl (default), sm=max-w-prose, lg=max-w-5xl
  <PageHeader title="Blog" description="Thoughts on networking and software." />
  <Section aria-label="Post list">
    {children}
  </Section>
</Container>
```

### Token architecture

Our tokens are the **source of truth**. shadcn tokens are **aliases**:

```css
/* globals.css — our tokens (source of truth) */
:root {
  --bg-base: #fafafa;
  --ink-primary: #1a1a1a;
  --accent: #2563eb;
  /* ... our full token set ... */
}

/* shadcn alias layer — maps to our tokens */
:root {
  --background: var(--bg-base);
  --foreground: var(--ink-primary);
  --card: var(--bg-raised);
  --card-foreground: var(--ink-primary);
  --primary: var(--accent);
  --primary-foreground: var(--ink-inverse);
  --secondary: var(--bg-muted);
  --secondary-foreground: var(--ink-primary);
  --muted: var(--bg-muted);
  --muted-foreground: var(--ink-secondary);
  --accent: var(--bg-muted);          /* shadcn's accent ≠ our accent */
  --accent-foreground: var(--ink-primary);
  --border: var(--border);
  --input: var(--border);
  --ring: var(--border-focus);
  --radius: 0.5rem;
}

/* @theme inline — generates Tailwind utilities */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  /* ... etc ... */
}
```

Both `bg-card` (shadcn) and `var(--bg-raised)` (our token) resolve to the same value.

## Implementation Steps

### Step 1: Run shadcn init

```bash
npx shadcn@latest init
```

When prompted:
- Style: New York
- Base color: Neutral (we override with our tokens)
- CSS variables: Yes

This creates `components.json` and `src/lib/utils.ts`.

### Step 2: Add shadcn primitives

```bash
npx shadcn@latest add button card input label badge textarea avatar separator skeleton spinner
```

### Step 3: Install animation + icon deps

```bash
npm install lucide-react tw-animate-css
```

### Step 4: Merge token layers in `globals.css`

- Add `@import "tw-animate-css";` at top (after `@import "tailwindcss"`)
- Keep our `:root` / `.dark` blocks as-is (source of truth)
- Add shadcn alias layer below our tokens (see Contracts section above)
- Add `@theme inline` block for Tailwind utility generation

### Step 5: Create layout primitives

Create `src/components/layout/container.tsx`, `section.tsx`, `page-header.tsx`, `index.ts` per the Contracts above.

### Step 6: Refactor existing components

Replace all inline-styled buttons/divs/cards with shadcn primitives in:
- `src/components/Header.tsx`
- `src/features/auth/components/sign-in-buttons.tsx`
- `src/app/(auth)/signin/page.tsx`
- `src/app/page.tsx`
- `src/app/posts/page.tsx`
- `src/app/posts/*/page.tsx`

Replace inline SVGs (Sun, Moon, Github) with `lucide-react` equivalents in Header and sign-in buttons. Keep Google SVG inline (not in lucide).

### Step 7: Verify

```bash
npx tsc --noEmit
npm run build
```

---

## Verification Checklist

- [ ] `src/lib/utils.ts` exports `cn`
- [ ] All 10 shadcn primitives exist in `src/components/ui/`
- [ ] `src/components/layout/` exports Container, Section, PageHeader
- [ ] `globals.css` has shadcn alias layer + `@theme inline` block
- [ ] Header uses `<Button>` and `<Avatar>` and lucide icons
- [ ] Sign-in page uses `<Card>` + `<CardHeader>` + `<CardContent>`
- [ ] Sign-in buttons use `<Button variant="outline">`
- [ ] Home page uses `<Card>` + `<Badge>` for post cards
- [ ] No inline SVGs remain for Sun/Moon/Github (replaced by lucide)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds

---

*Phase 0 complete. Next: [Phase 1 — Infrastructure](./01-infrastructure.md)*
