# Phase 3: Layout & Providers

> **Goal:** Wire up the root layout with auth session, theme, and i18n providers. Add a polished header (nav + sign-in + theme toggle + language switcher) and footer (social links). Set up middleware for auth redirects and locale routing.

---

## Prerequisites

Phase 1 (Infrastructure) and Phase 2 (Authentication) must be complete. You should have:

- `src/lib/db.ts` — Prisma client singleton
- `src/app/globals.css` — Design tokens and prose styles
- `next-auth` installed and configured (`src/app/api/auth/[...nextauth]/route.ts`)
- `.env` with `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

---

## Design Tokens Reference

These are already defined in `globals.css`. Do NOT redefine them — just reference:

| Token | Light | Dark |
|-------|-------|------|
| `--bg-base` | `#ffffff` | `#0d1117` |
| `--bg-raised` | `#f6f8fa` | `#161b22` |
| `--bg-muted` | `#f0f2f5` | `#21262d` |
| `--border` | `#d0d7de` | `#30363d` |
| `--ink-primary` | `#1c2333` | `#e6edf3` |
| `--ink-secondary` | `#57606a` | `#8b949e` |
| `--ink-tertiary` | `#8c959f` | `#484f58` |
| `--accent` | `#8baed6` | `#8baed6` |

---

## Step 1 — Install Dependencies

```bash
npm install next-auth@beta next-intl
```

> **Note:** Use `next-auth@beta` (Auth.js v5) for App Router compatibility. `next-intl` handles locale-based routing and translation loading.

---

## Step 2 — Create `SessionProvider` Wrapper

**File: `src/components/providers/SessionProvider.tsx`**

```tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

> Why a wrapper? `next-auth/react`'s `SessionProvider` is a client component. Wrapping it here keeps the import isolated and lets the root layout stay clean.

---

## Step 3 — Update Root Layout

**File: `src/app/layout.tsx`**

Replace the existing file completely:

```tsx
import type { Metadata, Viewport } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider, ThemeScript } from "@/components/theme";
import SessionProvider from "@/components/providers/SessionProvider";
import NextIntlProvider from "@/components/providers/NextIntlProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "My Tech Memoir",
    template: "%s | My Tech Memoir",
  },
  description:
    "A technical memoir on networking — how the internet routes data, written as it was learned.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col font-sans antialiased`}
      >
        <SessionProvider>
          <ThemeProvider>
            <NextIntlProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </NextIntlProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

### What changed

1. **Fonts via `next/font/google`** — Replaces the CSS `@import` URL. Loads Inter, Lora, and JetBrains Mono as CSS variables (`--font-sans`, `--font-serif`, `--font-mono`). Removes layout shift.
2. **`SessionProvider`** — Wraps everything so `useSession()` works in any client component.
3. **`NextIntlProvider`** — Injects locale + messages from `next-intl` into the React tree.
4. **`suppressHydrationWarning` on `<html>`** — Required by theme provider (class toggles on initial paint).
5. **Removed `className="dark"` from `<html>`** — ThemeScript handles this; static class causes flash.

---

## Step 4 — Create `NextIntlProvider`

**File: `src/components/providers/NextIntlProvider.tsx`**

```tsx
"use client";

import { NextIntlClientProvider } from "next-intl";
import { usePathname } from "next/navigation";

function getLocale(pathname: string): string {
  const segments = pathname.split("/");
  const first = segments[1];
  if (first === "fa" || first === "en") return first;
  return "en";
}

export default function NextIntlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = getLocale(pathname);

  // Messages are loaded client-side from the messages/ directory.
  // In a real app you'd use getMessages() server-side, but this
  // simple approach works for the initial layout phase.
  const messages = require(`@/messages/${locale}.json`);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

> **Important:** This is a simplified provider for Phase 3. When we add server components in later phases, we'll switch to `getRequestConfig` and server-side message loading. For now, client-side loading is fine.

---

## Step 5 — Create Translation Files

**File: `messages/en.json`**

```json
{
  "common": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "signIn": "Sign in",
    "signOut": "Sign out",
    "theme": {
      "light": "Switch to light mode",
      "dark": "Switch to dark mode"
    },
    "language": "Language",
    "switchLanguage": "Switch to {locale}"
  },
  "home": {
    "title": "My Tech Memoir",
    "subtitle": "Networking & Protocols"
  },
  "footer": {
    "copyright": "© {year} My Tech Memoir",
    "tagline": "Written while learning"
  },
  "auth": {
    "welcome": "Welcome, {name}",
    "welcomeAnonymous": "Welcome"
  }
}
```

**File: `messages/fa.json`**

```json
{
  "common": {
    "home": "خانه",
    "about": "درباره من",
    "blog": "وبلاگ",
    "signIn": "ورود",
    "signOut": "خروج",
    "theme": {
      "light": "تغییر به حالت روشن",
      "dark": "تغییر به حالت تاریک"
    },
    "language": "زبان",
    "switchLanguage": "تغییر زبان به {locale}"
  },
  "home": {
    "title": "خاطرات فنی من",
    "subtitle": "شبکه‌سازی و پروتکل‌ها"
  },
  "footer": {
    "copyright": "© {year} خاطرات فنی من",
    "tagline": "در حال یادگیری نوشته شده"
  },
  "auth": {
    "welcome": "خوش آمدید، {name}",
    "welcomeAnonymous": "خوش آمدید"
  }
}
```

> Both files must be at the project root under `messages/`. This is `next-intl`'s default convention.

---

## Step 6 — Update Header with Nav + Auth + Language

**File: `src/components/Header.tsx`**

Replace the existing file completely:

```tsx
"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/theme";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export default function Header() {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const { data: session } = useSession();
  const t = useTranslations("common");
  const isDark = resolvedTheme === "dark";

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg-raised)",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        {/* Logotype */}
        <Link
          href="/"
          className="group flex flex-col gap-0 shrink-0"
          style={{ textDecoration: "none" }}
        >
          <span
            className="font-serif text-lg font-semibold leading-tight tracking-tight transition-colors"
            style={{ color: "var(--ink-primary)" }}
          >
            {t("home.title")}
          </span>
          <span
            className="text-xs font-sans font-normal tracking-wide uppercase leading-none transition-colors"
            style={{ color: "var(--accent)", letterSpacing: "0.1em" }}
          >
            {t("home.subtitle")}
          </span>
        </Link>

        {/* Right side: nav actions */}
        <nav className="flex items-center gap-2">
          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Theme toggle */}
          {mounted ? (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? t("theme.light") : t("theme.dark")}
              title={isDark ? t("theme.light") : t("theme.dark")}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                color: "var(--ink-secondary)",
                backgroundColor: "var(--bg-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          ) : (
            <div className="w-8 h-8" aria-hidden="true" />
          )}

          {/* Sign in / Sign out */}
          {session ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                color: "var(--ink-secondary)",
                backgroundColor: "var(--bg-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {t("signOut")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signIn()}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                color: "var(--bg-base)",
                backgroundColor: "var(--accent)",
              }}
            >
              {t("signIn")}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
```

### What changed from Phase 2

1. **Auth buttons** — Uses `useSession()` from `next-auth/react`. Shows "Sign in" or "Sign out" depending on session state.
2. **Translations** — All user-facing strings go through `useTranslations("common")`.
3. **`LanguageSwitcher`** — Separate component (Step 7) for locale toggling.
4. **Responsive spacing** — Added `gap-4` and `shrink-0` for better layout on small screens.

---

## Step 7 — Create Language Switcher

**File: `src/components/LanguageSwitcher.tsx`**

```tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const LOCALES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
] as const;

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  function switchLocale(locale: string) {
    // Remove current locale prefix if present
    const segments = pathname.split("/");
    const firstSegment = segments[1];
    let cleanPath = pathname;

    if (firstSegment === "en" || firstSegment === "fa") {
      cleanPath = "/" + segments.slice(2).join("/");
    }

    // Prepend new locale (skip for default locale "en")
    const newPath = locale === "en" ? cleanPath : `/${locale}${cleanPath}`;
    router.push(newPath);
  }

  const currentLocale =
    pathname.split("/")[1] === "fa" ? "fa" : "en";

  return (
    <div className="relative group">
      <button
        type="button"
        aria-label={t("language")}
        className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-150 hover:opacity-80 active:scale-95"
        style={{
          color: "var(--ink-secondary)",
          backgroundColor: "var(--bg-muted)",
          border: "1px solid var(--border)",
        }}
      >
        <span className="text-base leading-none">
          {currentLocale === "fa" ? "🇮🇷" : "🇺🇸"}
        </span>
      </button>

      {/* Dropdown */}
      <div
        className="absolute right-0 top-full mt-1 w-36 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50"
        style={{
          backgroundColor: "var(--bg-raised)",
          border: "1px solid var(--border)",
        }}
      >
        {LOCALES.map((locale) => (
          <button
            key={locale.code}
            type="button"
            onClick={() => switchLocale(locale.code)}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors first:rounded-t-md last:rounded-b-md"
            style={{
              color:
                currentLocale === locale.code
                  ? "var(--accent)"
                  : "var(--ink-primary)",
              backgroundColor:
                currentLocale === locale.code
                  ? "var(--bg-muted)"
                  : "transparent",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor =
                "var(--bg-muted)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor =
                currentLocale === locale.code ? "var(--bg-muted)" : "transparent";
            }}
          >
            <span className="text-base leading-none">{locale.flag}</span>
            <span>{locale.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Design notes

- **Hover dropdown** — CSS `group-hover` for no-JS interaction; works on desktop. Mobile: consider adding a click toggle in Phase 8 (Polish).
- **Current locale highlighting** — Active locale shown in accent color.
- **Path manipulation** — Detects locale from URL path, strips it, prepends the new one.

---

## Step 8 — Update Footer with Social Links

**File: `src/components/Footer.tsx`**

Replace the existing file completely:

```tsx
import { useTranslations } from "next-intl";

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    href: "https://github.com/KoushyarHB",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/in/koushyarhb",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "Email",
    href: "mailto:koushyarhb@gmail.com",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg-raised)",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-6 flex items-center justify-between">
        <p
          className="text-sm font-sans"
          style={{ color: "var(--ink-tertiary)" }}
        >
          © {year} My Tech Memoir
        </p>

        {/* Social links */}
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target={link.href.startsWith("mailto") ? undefined : "_blank"}
              rel={
                link.href.startsWith("mailto")
                  ? undefined
                  : "noopener noreferrer"
              }
              aria-label={link.name}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                color: "var(--ink-tertiary)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--ink-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--ink-tertiary)";
              }}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
```

> **Note:** The social URLs are hardcoded from the GitHub profile in `docs/README.md`. Update these to your actual URLs.

---

## Step 9 — Create Middleware for Auth + i18n

**File: `src/middleware.ts`**

```tsx
import createMiddleware from "next-intl/middleware";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const locales = ["en", "fa"];
const defaultLocale = "en";

// i18n middleware — redirects unknown locales to default
const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
});

export default withAuth(
  function middleware(req) {
    // Auth is handled — now run i18n routing
    return handleI18nRouting(req);
  },
  {
    callbacks: {
      authorized({ token }) {
        // Allow unauthenticated access to all pages for now.
        // Protect specific routes in later phases:
        //   return !!token; // require auth for all
        return true;
      },
    },
  }
);

export const config = {
  // Match all pathnames except:
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /favicon.ico, robots.txt, sitemap.xml (static files)
  // - files with extensions (images, etc.)
  matcher: [
    "/((?!api|_next|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
```

### How this works

1. **`withAuth`** wraps the middleware — attaches the JWT token to the request.
2. **`createMiddleware`** from `next-intl` handles locale detection and redirects:
   - `/` → `/en` (or `/fa` if `Accept-Language` header matches)
   - `/about` → `/en/about`
   - `/fa/about` → stays at `/fa/about`
3. **`authorized` callback** — Currently returns `true` for all. When you want to protect admin routes (like `/dashboard`), change to `return !!token` and add a custom matcher.

---

## Step 10 — Update `next.config.js`

**File: `next.config.js`**

Replace the existing file:

```js
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withNextIntl(nextConfig);
```

---

## Step 11 — Create i18n Request Config

**File: `src/i18n/request.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(["en", "fa"], requested) ? requested : "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

> This is the server-side counterpart to the client `NextIntlProvider`. It runs in server components and API routes.

---

## Step 12 — Remove CSS Font Import

**File: `src/app/globals.css`**

Delete line 1 (the `@import url(...)` for Google Fonts):

```diff
-@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap');
 @import "tailwindcss";
```

> Fonts are now loaded via `next/font/google` in `layout.tsx`, which self-hosts them and eliminates the external request.

---

## Step 13 — Add `NEXT_PUBLIC_SITE_URL` to `.env`

**File: `.env`**

Append:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Verification Checklist

After completing all steps, verify:

```bash
# 1. Build succeeds
npm run build

# 2. Dev server starts
npm run dev

# 3. Visit http://localhost:3000
#    → Redirects to /en
#    → Theme toggle works (sun/moon icons)
#    → Sign in button visible
#    → Language switcher shows 🇺🇸 flag
#    → Footer shows social icons (GitHub, LinkedIn, Email)

# 4. Click language switcher → select 🇇🇷 (Farsi)
#    → URL changes to /fa
#    → Text direction stays LTR (RTL support in Phase 8)

# 5. Click Sign in → Auth.js provider page loads
#    → Sign in with GitHub or Google
#    → Redirects back, header shows "Sign out"

# 6. Open browser DevTools → Application → Local Storage
#    → `theme` key exists with "light", "dark", or "system"
```

---

## File Summary

| Action | File |
|--------|------|
| CREATE | `src/components/providers/SessionProvider.tsx` |
| CREATE | `src/components/providers/NextIntlProvider.tsx` |
| CREATE | `src/components/LanguageSwitcher.tsx` |
| CREATE | `messages/en.json` |
| CREATE | `messages/fa.json` |
| CREATE | `src/middleware.ts` |
| CREATE | `src/i18n/request.ts` |
| REWRITE | `src/app/layout.tsx` |
| REWRITE | `src/components/Header.tsx` |
| REWRITE | `src/components/Footer.tsx` |
| REWRITE | `next.config.js` |
| EDIT | `src/app/globals.css` (remove line 1) |
| EDIT | `.env` (append `NEXT_PUBLIC_SITE_URL`) |

---

## Common Pitfalls

1. **`next-auth@beta` vs `next-auth`** — Always use `next-auth@beta` (v5) for App Router. v4 uses `getServerSession` which is different.

2. **Font variable names** — Must match `--font-sans`, `--font-serif`, `--font-mono` in both `next/font` config and `globals.css` `@theme` block.

3. **`suppressHydrationWarning`** — Must be on `<html>`, not `<body>`. Without it, React will warn about the `class="dark"` mismatch on first render.

4. **Middleware matcher** — The regex must exclude `/api/*` routes or NextAuth's API endpoints will break. The pattern shown above handles this.

5. **`next-intl` plugin order** — `withNextIntl` must be the outermost wrapper in `next.config.js`, or locale detection won't work.

6. **Farsi (fa) locale** — No RTL support yet. The text will display LTR. Phase 8 (Polish) adds `dir="rtl"` toggling. Don't add RTL prematurely — it breaks the layout.

7. **`SessionProvider` must be client-only** — The `"use client"` directive is mandatory. Without it, you'll get a confusing server component error.
