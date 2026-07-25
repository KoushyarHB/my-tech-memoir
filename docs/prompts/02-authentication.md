# Phase 2 — Authentication

> **Goal:** Add complete authentication using Auth.js v5 (NextAuth) with GitHub and Google providers, Prisma adapter, and a polished sign-in page.
>
> **Prerequisites:** Phase 1 (Infrastructure) must be complete — Prisma schema, DB client singleton (`src/lib/db.ts`), and Neon connection are working.

---

## Step 0 — Install Dependencies

```bash
npm install next-auth@beta @auth/prisma-adapter
```

> **Note:** `next-auth@beta` is the stable Auth.js v5 release used with Next.js App Router. The `@auth/prisma-adapter` bridges Auth.js to your existing Prisma/Neon setup.

---

## Step 1 — Add Auth Models to Prisma Schema

Append the following models to `prisma/schema.prisma`. These are required by the Auth.js Prisma adapter:

```prisma
// ─── Auth (Auth.js / NextAuth) ─────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?

  accounts Account[]
  sessions Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

After editing, run:

```bash
npx prisma generate
npx prisma db push
```

> `db push` syncs the schema to Neon without creating a migration file. This is fine for a solo project; use `prisma migrate dev` if you prefer migration files.

---

## Step 2 — Auth Configuration

Create `src/features/auth/config/auth-options.ts`:

```typescript
import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, token }) {
      // Expose user.id on the client session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
};
```

### Why JWT strategy?

The Prisma adapter + Neon works with database sessions, but JWT avoids an extra DB query on every authenticated request. For a personal blog with low traffic, this is the pragmatic choice. If you later need server-side session invalidation, switch to `strategy: "database"` and remove the JWT callbacks.

---

## Step 3 — Auth API Route

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/features/auth/config/auth-options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

---

## Step 4 — Session Provider Wrapper

Create `src/features/auth/components/SessionProvider.tsx`:

```typescript
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

### Update Root Layout

Wrap your existing layout content with the session provider. Edit `src/app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider, ThemeScript } from "@/components/theme";
import SessionProvider from "@/features/auth/components/SessionProvider";

export const metadata: Metadata = {
  title: "My Tech Memoir",
  description:
    "A technical memoir on networking — how the internet routes data, written as it was learned.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className="min-h-screen flex flex-col transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--ink-primary)",
        }}
      >
        <SessionProvider>
          <ThemeProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

> `SessionProvider` must be a Client Component wrapper (Step 4). It sits outside `ThemeProvider` so the session is available to any client component, including theme-aware ones.

---

## Step 5 — Sign-In Page

Create `src/app/(auth)/signin/page.tsx`:

```typescript
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/features/auth/config/auth-options";
import SignInButtons from "@/features/auth/components/SignInButtons";

export const metadata: Metadata = {
  title: "Sign In — My Tech Memoir",
};

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-5">
      <div
        className="w-full max-w-sm rounded-xl p-8 space-y-6"
        style={{
          backgroundColor: "var(--bg-raised)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="space-y-2 text-center">
          <h1
            className="font-serif text-2xl font-semibold"
            style={{ color: "var(--ink-primary)" }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--ink-secondary)" }}
          >
            Sign in to leave comments and bookmark posts.
          </p>
        </div>

        <SignInButtons />

        <p
          className="text-center text-xs"
          style={{ color: "var(--ink-tertiary)" }}
        >
          By signing in you agree to the site&apos;s terms.
        </p>
      </div>
    </div>
  );
}
```

---

## Step 6 — Social Login Buttons (Client Component)

Create `src/features/auth/components/SignInButtons.tsx`:

```typescript
"use client";

import { signIn } from "next-auth/react";

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function SignInButtons() {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl: "/" })}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          backgroundColor: "var(--bg-muted)",
          color: "var(--ink-primary)",
          border: "1px solid var(--border)",
        }}
      >
        <GitHubIcon />
        Continue with GitHub
      </button>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          backgroundColor: "var(--bg-muted)",
          color: "var(--ink-primary)",
          border: "1px solid var(--border)",
        }}
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </div>
  );
}
```

---

## Step 7 — Type Extension for Session

Auth.js doesn't include `id` on the session user by default. Add a type extension so `session.user.id` is typed correctly.

Create `src/features/auth/types/next-auth.d.ts`:

```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
  }
}
```

---

## Step 8 — Update Environment Variables

Add the following to `.env.example`:

```bash
# ─── Auth (Auth.js / NextAuth) ──────────────────────────
# Generate a random secret: openssl rand -base64 32
AUTH_SECRET=""

# GitHub OAuth — https://github.com/settings/developers
# Callback URL: http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Google OAuth — https://console.cloud.google.com/apis/credentials
# Callback URL: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Generate AUTH_SECRET

```bash
npx auth secret
```

Or manually:

```bash
openssl rand -base64 32
```

Paste the output into `AUTH_SECRET` in your `.env` file.

### OAuth Provider Setup

**GitHub:**
1. Go to https://github.com/settings/developers → New OAuth App
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Client Secret into `.env`

**Google:**
1. Go to https://console.cloud.google.com/apis/credentials → Create OAuth Client ID
2. Set **Authorized redirect URIs** to `http://localhost:3000/api/auth/callback/google`
3. Copy Client ID and Client Secret into `.env`

---

## Step 9 — Add Sign-In Link to Header

Update `src/components/Header.tsx` to show a sign-in/sign-out button. Add this to the existing header, next to the theme toggle:

```typescript
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/theme";

// ... keep existing SunIcon and MoonIcon components ...

export default function Header() {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const { data: session } = useSession();
  const isDark = resolvedTheme === "dark";

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg-raised)",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logotype — serif */}
        <Link
          href="/"
          className="group flex flex-col gap-0"
          style={{ textDecoration: "none" }}
        >
          <span
            className="font-serif text-lg font-semibold leading-tight tracking-tight transition-colors"
            style={{ color: "var(--ink-primary)" }}
          >
            My Tech Memoir
          </span>
          <span
            className="text-xs font-sans font-normal tracking-wide uppercase leading-none transition-colors"
            style={{ color: "var(--accent)", letterSpacing: "0.1em" }}
          >
            Networking &amp; Protocols
          </span>
        </Link>

        {/* Right side: auth + theme */}
        <div className="flex items-center gap-2">
          {/* Auth button */}
          {mounted && (
            session?.user ? (
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs px-2.5 py-1 rounded-md transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    color: "var(--ink-secondary)",
                    backgroundColor: "var(--bg-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                className="text-xs px-2.5 py-1 rounded-md transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  color: "var(--ink-secondary)",
                  backgroundColor: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
            )
          )}

          {/* Theme toggle — keep existing */}
          {mounted ? (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
        </div>
      </div>
    </header>
  );
}
```

---

## Verification Checklist

After completing all steps, verify:

```bash
# 1. Build succeeds (catches type errors)
npm run build

# 2. Dev server starts
npm run dev
```

Then manually verify in the browser:

- [ ] Visit `/signin` — page renders with GitHub and Google buttons
- [ ] Click "Continue with GitHub" — redirects to GitHub OAuth
- [ ] After auth, redirects back to `/` with user avatar in header
- [ ] Header shows "Sign out" button when authenticated
- [ ] Click "Sign out" — returns to signed-out state
- [ ] Visit `/signin` while authenticated — redirects to `/`
- [ ] `useSession()` returns user data in client components
- [ ] `getServerSession()` works in server components (the sign-in page already uses this)

---

## File Tree (New / Modified)

```
prisma/schema.prisma                          ← modified (auth models)
src/
├── app/
│   ├── (auth)/signin/page.tsx                ← new (sign-in page)
│   ├── api/auth/[...nextauth]/route.ts       ← new (API route)
│   └── layout.tsx                            ← modified (SessionProvider)
├── features/auth/
│   ├── components/
│   │   ├── SessionProvider.tsx               ← new (client wrapper)
│   │   └── SignInButtons.tsx                 ← new (social buttons)
│   ├── config/
│   │   └── auth-options.ts                   ← new (NextAuth config)
│   └── types/
│       └── next-auth.d.ts                    ← new (session types)
├── components/
│   └── Header.tsx                            ← modified (auth button)
.env.example                                  ← modified (auth env vars)
```

---

## Pitfalls

1. **`AUTH_SECRET` is required.** Without it, Auth.js throws a runtime error. Use `npx auth secret` or `openssl rand -base64 32`.

2. **OAuth callback URLs must match exactly.** A trailing slash or `https` vs `http` mismatch will cause a cryptic "Configuration" error. Double-check in both GitHub/Google console and your `.env`.

3. **Prisma `db push` vs `migrate dev`.** This prompt uses `db push` for speed. If you later add collaborators, switch to `prisma migrate dev --name add-auth` for a proper migration history.

4. **JWT strategy + Prisma adapter.** The adapter still writes Account/Session/User records to the DB for OAuth linking. The `session.strategy: "jwt"` just means session tokens aren't stored in the Session table — they're stateless JWTs. This is intentional for performance.

5. **`next-auth/react` vs `next-auth`.** The `SessionProvider` and `signIn`/`signOut` functions come from `next-auth/react` (client-side). The `getServerSession` and `authOptions` are from `next-auth` (server-side). Mixing these up causes confusing errors.

6. **`@auth/prisma-adapter` import path.** It's `@auth/prisma-adapter`, not `next-auth/adapters/prisma`. The old import path was for NextAuth v4.

---

*Phase 2 complete. Next: [Phase 3 — Layout & Providers](./03-layout-providers.md)*
