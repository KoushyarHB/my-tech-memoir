# Phase 2: Authentication

> **Status:** ✅ COMPLETED
> **Prerequisites:** Phase 1 (Infrastructure) complete — Prisma schema with `User`/`Account`/`Session`/`VerificationToken` models, `db` singleton.
> **Goal:** Auth.js v5 (NextAuth) with GitHub + Google providers, JWT sessions, Prisma adapter, custom sign-in page.

---

## Consumes

- `db` from `@/lib/db` (Phase 1)
- Prisma models: `User`, `Account`, `Session`, `VerificationToken` (Phase 1)
- `User.image` field (Phase 1 — named `image` not `avatarUrl` for adapter compatibility)

## Produces

### Files

| File | Status | Exports |
|------|--------|---------|
| `src/auth.ts` | ✅ Complete | `handlers`, `signIn`, `signOut`, `auth` |
| `src/app/api/auth/[...nextauth]/route.ts` | ✅ Complete | `GET`, `POST` (re-exported from `handlers`) |
| `src/components/providers/session-provider.tsx` | ✅ Complete | `SessionProvider` (default export) |
| `src/features/auth/types/next-auth.d.ts` | ✅ Complete | Type augmentation: `Session.user.id: string` |
| `src/features/auth/components/sign-in-buttons.tsx` | ✅ Complete | `SignInButtons` (default export) |
| `src/app/(auth)/signin/page.tsx` | ✅ Complete | Sign-in page (server component) |
| `src/proxy.ts` | ✅ Complete | `export { auth as proxy }` — Next.js 16 middleware |
| `src/components/Header.tsx` | ✅ Modified | Added `useSession`, sign-in/out UI |
| `src/app/layout.tsx` | ✅ Modified | Wrapped with `<SessionProvider>` |

### Dependencies Installed

```
next-auth@5.0.0-beta.32 (Auth.js v5)
@auth/prisma-adapter@2.11.3
```

## Does NOT Build

- ❌ Route protection middleware logic (Phase 3 adds i18n + auth middleware)
- ❌ Password/credentials auth (out of scope — OAuth only)
- ❌ Email magic link / phone auth (deferred — GitHub + Google only for v1)
- ❌ User profile page (future iteration)

## Contracts

### `auth()` — server-side session accessor

```typescript
import { auth } from "@/auth";

// In any Server Component or Route Handler:
const session = await auth();

if (session?.user) {
  console.log(session.user.id);    // string (database user ID)
  console.log(session.user.name);  // string | null
  console.log(session.user.email); // string | null
  console.log(session.user.image); // string | null (avatar URL)
}
```

### `signIn` / `signOut` — client-side auth actions

```typescript
import { signIn, signOut } from "next-auth/react";

// Client Component — redirect to OAuth provider
signIn("github", { callbackUrl: "/" });
signIn("google", { callbackUrl: "/" });

// Client Component — sign out
signOut({ callbackUrl: "/" });
```

> **Important:** `signIn` / `signOut` from `next-auth/react` are CLIENT-ONLY. `auth()` from `@/auth` is SERVER-ONLY. Do not mix these up.

### `SessionProvider` — client wrapper

```typescript
import SessionProvider from "@/components/providers/session-provider";

// Already integrated in src/app/layout.tsx — wraps entire app
// No action needed in later phases. useSession() works everywhere.
```

### `useSession()` — client-side session hook

```typescript
import { useSession } from "next-auth/react";

// In any Client Component:
const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
// session?.user?.id, .name, .email, .image
```

### Auth Configuration (`src/auth.ts`)

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [GitHub, Google],       // reads AUTH_GITHUB_ID, AUTH_GOOGLE_ID from env
  trustHost: true,                    // required for Vercel deployment
  pages: { signIn: "/signin" },       // custom sign-in page
  session: { strategy: "jwt" },       // stateless sessions (no DB query per request)
  callbacks: {
    session: ({ session, token }) => { /* expose user.id on session */ },
    jwt: ({ token, user }) => { /* store user.id in JWT */ },
  },
});
```

### Environment Variables (required for auth to work)

```bash
# .env (NOT in repo — user creates locally)
AUTH_SECRET=""               # generate: npx auth secret
AUTH_GITHUB_ID=""            # https://github.com/settings/developers
AUTH_GITHUB_SECRET=""        # callback: http://localhost:3000/api/auth/callback/github
AUTH_GOOGLE_ID=""            # https://console.cloud.google.com/apis/credentials
AUTH_GOOGLE_SECRET=""        # callback: http://localhost:3000/api/auth/callback/google
```

### Route Paths

| Path | Type | Auth |
|------|------|------|
| `/signin` | Server Component page | Public (redirects to `/` if already authed) |
| `/api/auth/*` | Route Handler (Auth.js) | Public |

> **Phase 3 note:** When i18n routing is added, `/signin` moves to `/[locale]/signin`. The `pages.signIn` config in `auth.ts` must update to include the locale prefix, OR keep `/signin` outside the locale segment.

## What Was Actually Built (deviations from original prompt)

| Original prompt said | What we did | Why |
|---------------------|-------------|-----|
| `NextAuthOptions` + v4 API | Auth.js v5 `NextAuth()` init | Prompt installed `next-auth@beta` (v5) but wrote v4 code. v5 is the correct API for Next.js App Router. |
| `src/features/auth/config/auth-options.ts` | `src/auth.ts` | v5 convention — shorter imports, framework standard |
| `middleware.ts` | `src/proxy.ts` | Next.js 16 renamed middleware → proxy |
| `GITHUB_CLIENT_ID` env vars | `AUTH_GITHUB_ID` | v5 auto-detects `AUTH_` prefix |
| `getServerSession(authOptions)` | `auth()` | v5 replaces `getServerSession` with the `auth()` export |
| Replace `layout.tsx` fully | Minimal edit — added `SessionProvider` wrapper | Preserved existing theme system |
| Replace `Header.tsx` fully | Augmented — added auth button + avatar | Preserved existing sticky/blur design |
| GitHub + Google with explicit `issuer` | Kept `issuer` config (user-added commit) | Redundant but harmless — v5 auto-resolves these |

## Pending (user action required)

1. Create `.env` with `AUTH_SECRET` (run `npx auth secret`)
2. Create GitHub OAuth app → add `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
3. Create Google OAuth credentials → add `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
4. Run `npx prisma migrate dev --name init` — adapter needs User/Account tables

---

*Phase 2 complete. Next: [Phase 3 — Layout & i18n](./03-layout-providers.md)*
