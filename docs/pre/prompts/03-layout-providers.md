# Phase 3: Layout & i18n

> **Status:** ⏳ PLANNED
> **Prerequisites:** Phase 0 (Design System), Phase 1 (Infrastructure), Phase 2 (Authentication)
> **Goal:** Add internationalization (next-intl), reorganize routes under `[locale]/`, add language switcher, social footer links, and merge auth + i18n middleware.

---

## Consumes

- `<Button>` from `@/components/ui/button` (Phase 0)
- `<Container>` from `@/components/layout` (Phase 0)
- `cn()` from `@/lib/utils` (Phase 0)
- `auth` from `@/auth` (Phase 2) — for middleware integration
- Existing theme system: `ThemeProvider`, `ThemeScript`, `useTheme` (NOT replaced)
- Existing `Header.tsx`, `Footer.tsx`, `layout.tsx` (augmented, not replaced)

## Produces

### Files Created

| File | Exports |
|------|---------|
| `src/i18n/request.ts` | `getRequestConfig()` — server-side message loader |
| `src/i18n/routing.ts` | `routing` — locale config object |
| `messages/en.json` | English translations |
| `messages/fa.json` | Farsi (Persian) translations |
| `src/components/providers/next-intl-provider.tsx` | `NextIntlProvider` — client wrapper |
| `src/components/language-switcher.tsx` | `LanguageSwitcher` — locale dropdown |
| `src/app/[locale]/(main)/layout.tsx` | Main layout (Header + Footer wrapper) |

### Files Modified

| File | Changes |
|------|---------|
| `src/proxy.ts` | Merge `auth` proxy + `next-intl` middleware |
| `next.config.js` | Wrap with `withNextIntl` plugin |
| `src/app/layout.tsx` | Add `<NextIntlProvider>`, switch to `next/font/google` |
| `src/components/Header.tsx` | Add `<LanguageSwitcher>`, use `useTranslations` for strings |
| `src/components/Footer.tsx` | Add social link icons (GitHub, LinkedIn, Email) |

### Files Moved (route restructure)

```
src/app/page.tsx                              → src/app/[locale]/(main)/page.tsx
src/app/posts/page.tsx                        → src/app/[locale]/(main)/posts/page.tsx
src/app/posts/*/page.tsx                      → src/app/[locale]/(main)/posts/*/page.tsx
src/app/(auth)/signin/page.tsx                → src/app/[locale]/(auth)/signin/page.tsx
```

### Dependencies Installed

```bash
npm install next-intl
```

## Does NOT Build

- ❌ Theme system (keep existing `src/lib/theme.ts` + `ThemeProvider` — do NOT install `next-themes`)
- ❌ Header from scratch (augment existing with LanguageSwitcher + translations)
- ❌ shadcn/ui primitives (Phase 0)
- ❌ Blog/comments/bookmarks pages (Phases 4-6)
- ❌ RTL support (Farsi text renders LTR for now — RTL deferred to Phase 8 polish)

## Contracts

### Locale routing

```typescript
// Supported locales
const locales = ["en", "fa"] as const;
const defaultLocale = "en";

// URL structure:
// /              → /en (redirects)
// /en            → English home
// /fa            → Farsi home
// /en/posts      → English posts
// /fa/posts      → Farsi posts
```

### `useTranslations()` — available in all Client Components

```typescript
import { useTranslations } from "next-intl";

// In any Client Component inside the [locale] tree:
const t = useTranslations("common");
t("signIn");     // → "Sign in" (en) or "ورود" (fa)
t("theme.dark"); // → "Switch to dark mode" (en)
```

### `getTranslations()` — available in Server Components

```typescript
import { getTranslations } from "next-intl/server";

// In any Server Component:
const t = await getTranslations("common");
```

### Translation file structure (`messages/en.json`)

```json
{
  "common": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "signIn": "Sign in",
    "signOut": "Sign out",
    "theme": { "light": "Switch to light mode", "dark": "Switch to dark mode" },
    "language": "Language"
  },
  "home": { "title": "My Tech Memoir", "subtitle": "Networking & Protocols" },
  "footer": { "copyright": "© {year} My Tech Memoir", "tagline": "Written while learning" }
}
```

### Proxy (merged auth + i18n)

```typescript
// src/proxy.ts
import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";

const locales = ["en", "fa"];
const defaultLocale = "en";

const handleI18n = createMiddleware({ locales, defaultLocale });

export default auth((req) => {
  return handleI18n(req);
});

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
```

### Route structure after Phase 3

```
src/app/
├── layout.tsx                              ← root (fonts, ThemeProvider, SessionProvider, NextIntlProvider)
├── globals.css
├── [locale]/
│   ├── (main)/
│   │   ├── layout.tsx                      ← NEW: Header + Footer wrapper
│   │   ├── page.tsx                        ← home (moved from src/app/page.tsx)
│   │   └── posts/                          ← temporary (migrated to /blog in Phase 4)
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   └── (auth)/
│       └── signin/
│           └── page.tsx
└── api/
    └── auth/[...nextauth]/route.ts         ← stays outside [locale] (API routes don't need locale)
```

## Implementation Steps

### Step 1: Install next-intl

```bash
npm install next-intl
```

### Step 2: Configure `next.config.js`

```js
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
module.exports = withNextIntl(nextConfig);
```

### Step 3: Create i18n config

- `src/i18n/routing.ts` — locale definitions
- `src/i18n/request.ts` — `getRequestConfig()` for server-side message loading
- `messages/en.json` — English translations
- `messages/fa.json` — Farsi translations

### Step 4: Create NextIntlProvider

`src/components/providers/next-intl-provider.tsx` — client wrapper that detects locale from pathname and injects messages.

### Step 5: Update root layout

- Add `<NextIntlProvider>` to the provider stack
- Switch fonts to `next/font/google` (Inter, Lora, JetBrains Mono)
- Remove the `@import url(...)` from `globals.css` (already removed in Phase 2 token rename)

### Step 6: Create `[locale]/(main)/layout.tsx`

Wraps children with Header + Footer. Root layout handles providers; this layout handles page chrome.

### Step 7: Move existing routes

Move all page files under `src/app/[locale]/` per the route structure above.

### Step 8: Update Header

- Import `useTranslations` from `next-intl`
- Replace hardcoded strings with `t("signIn")`, `t("signOut")`, etc.
- Add `<LanguageSwitcher />` between logo and auth button

### Step 9: Create LanguageSwitcher

Client component with hover dropdown showing 🇺🇸 English / 🇮🇷 فارسی. Uses `useRouter().push()` for locale switching.

### Step 10: Update Footer

Add social link icons (GitHub, LinkedIn, Email) using inline SVGs or lucide icons. Keep copyright + tagline.

### Step 11: Merge proxy.ts

Combine `auth` proxy from Phase 2 with `next-intl` middleware.

### Step 12: Verify

```bash
npx tsc --noEmit
npm run build
```

---

## Verification Checklist

- [ ] `next-intl` installed and configured
- [ ] `messages/en.json` and `messages/fa.json` exist
- [ ] Visiting `/` redirects to `/en`
- [ ] Visiting `/fa` shows Farsi translations
- [ ] Language switcher in Header toggles locale
- [ ] Header strings are translated (sign in, sign out, theme labels)
- [ ] Footer has social link icons
- [ ] Proxy merges auth + i18n (no API route interference)
- [ ] All existing routes moved under `[locale]/`
- [ ] `npm run build` succeeds

---

## Pitfalls

1. **`next-intl/plugin` must be outermost wrapper** in `next.config.js` — or locale detection fails silently.
2. **Matcher must exclude `/api/*`** — or Auth.js route handlers break.
3. **API routes stay outside `[locale]/`** — they don't need locale prefix.
4. **`suppressHydrationWarning` stays on `<html>`** — required by theme system.
5. **Farsi (fa) renders LTR for now** — RTL support deferred to Phase 8. Don't add `dir="rtl"` prematurely; it breaks layout.

---

*Phase 3 complete. Next: [Phase 4 — Blog Feature](./04-blog.md)*
