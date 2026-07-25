# Phase 6: Bookmarks

## Overview

Implement a bookmark feature for my-tech-memoir — a personal developer blog built with Next.js 16 (App Router), Prisma 7, Neon PostgreSQL, shadcn/ui, and Tailwind 4.

Bookmarks let signed-in users save posts to a personal "My Bookmarks" page. The bookmark button appears on individual blog post pages. Unauthenticated users see a prompt to sign in when they click the bookmark icon.

---

## Prerequisites

Before starting, confirm these are in place:

- **Prisma schema** has the `Bookmark` model (see below)
- **Prisma client** singleton exists at `src/lib/db.ts`
- **NextAuth.js** is configured with session handling
- **Blog feature** is complete — `Post` model, `post-service.ts`, and blog post pages exist
- **API response helper** exists at `src/lib/api-response.ts`
- **shadcn/ui** Button component is installed at `src/components/ui/button.tsx`

### Bookmark Model (should already exist in `prisma/schema.prisma`)

```prisma
model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId])
  @@index([postId])
}
```

If the `Bookmark` model is missing from your schema, add it along with the required relations on `User` and `Post` models, then run:

```bash
npx prisma migrate dev --name add-bookmarks
npx prisma generate
```

---

## Tech Stack Context

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| React | React 19 |
| Language | TypeScript (strict mode) |
| ORM | Prisma 7 with `@prisma/adapter-neon` |
| Database | Neon PostgreSQL (serverless) |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Components | shadcn/ui |
| Auth | NextAuth.js (Auth.js) |

---

## Architecture Rules

Follow the project's **Feature-Based (Vertical Slice)** architecture:

- Domain code lives in `src/features/bookmarks/`
- Server services go in `src/features/bookmarks/server/`
- Components go in `src/features/bookmarks/components/`
- Types go in `src/features/bookmarks/types/`
- **Client components** (`'use client'`) must NEVER import from `features/*/server/*` — they communicate through `/api/*` endpoints
- **Server components** and **API routes** may directly call server services
- Always use `@/*` path alias (maps to `./src/*`)
- Use `kebab-case` for file and directory names
- Export named `PascalCase` functions from kebab-case files

---

## Design Tokens

The project uses CSS custom properties defined in `src/app/globals.css`. Use these (not hardcoded colors):

```
--bg-base, --bg-raised, --bg-overlay, --bg-muted
--ink-primary, --ink-secondary, --ink-tertiary
--accent, --accent-hover, --accent-muted
--border, --border-muted
```

Dark mode is handled by the `.dark` class on `<html>`. Components should use inline `style={{ color: "var(--ink-primary)" }}` or reference these tokens.

---

## Step-by-Step Implementation

### Step 1: Bookmark Types

Create `src/features/bookmarks/types/index.ts`:

```typescript
import type { Post, Bookmark, User } from "@/generated/prisma/client";

export type BookmarkWithPost = Bookmark & {
  post: Post;
};

export type BookmarkWithUser = Bookmark & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

export type ToggleBookmarkInput = {
  postId: string;
};

export type ToggleBookmarkResponse = {
  bookmarked: boolean;
  bookmarkId: string | null;
};
```

---

### Step 2: Bookmark Service

Create `src/features/bookmarks/server/bookmark-service.ts`:

```typescript
import { db } from "@/lib/db";

/**
 * Check if a user has bookmarked a specific post.
 * Returns the bookmark record if it exists, null otherwise.
 */
export async function isBookmarked(userId: string, postId: string) {
  return await db.bookmark.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });
}

/**
 * Toggle a bookmark on or off for a given user and post.
 * If the bookmark exists, delete it. If not, create it.
 * Returns the new state and the bookmark ID (null if removed).
 */
export async function toggleBookmark(userId: string, postId: string) {
  const existing = await db.bookmark.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existing) {
    await db.bookmark.delete({
      where: { id: existing.id },
    });
    return { bookmarked: false, bookmarkId: null };
  }

  const bookmark = await db.bookmark.create({
    data: { userId, postId },
  });

  return { bookmarked: true, bookmarkId: bookmark.id };
}

/**
 * Get all bookmarks for a user, with post data included.
 * Returns bookmarks sorted by most recent first.
 */
export async function getBookmarksByUserId(userId: string) {
  return await db.bookmark.findMany({
    where: { userId },
    include: { post: true },
    orderBy: { createdAt: "desc" },
  });
}
```

---

### Step 3: Bookmark Button Component

Create `src/features/bookmarks/components/bookmark-button.tsx`:

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type BookmarkButtonProps = {
  postId: string;
  initialBookmarked?: boolean;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

export function BookmarkButton({
  postId,
  initialBookmarked = false,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  // Sync with server state on mount
  useEffect(() => {
    if (!session?.user) return;

    async function checkBookmark() {
      try {
        const res = await fetch(
          `/api/bookmarks?postId=${postId}`
        );
        if (res.ok) {
          const json = await res.json();
          setBookmarked(json.data?.bookmarked ?? false);
        }
      } catch {
        // Silently fail — default to unbookmarked
      }
    }

    checkBookmark();
  }, [postId, session?.user]);

  const handleToggle = useCallback(async () => {
    if (!session?.user) {
      // Redirect to sign-in or show prompt
      window.location.href = "/auth/signin";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (res.ok) {
        const json = await res.json();
        setBookmarked(json.data?.bookmarked ?? false);
      }
    } catch {
      // Silently fail — state reverts on next page load
    } finally {
      setLoading(false);
    }
  }, [postId, session?.user]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className="flex items-center justify-center w-9 h-9 rounded-md transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
      style={{
        color: bookmarked ? "var(--accent)" : "var(--ink-secondary)",
        backgroundColor: bookmarked ? "var(--bg-muted)" : "transparent",
        border: "1px solid var(--border)",
      }}
    >
      <BookmarkIcon filled={bookmarked} />
    </button>
  );
}
```

---

### Step 4: Bookmarks API Route

Create `src/app/api/bookmarks/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/config/auth-options";
import { apiResponse } from "@/lib/api-response";
import {
  toggleBookmark,
  getBookmarksByUserId,
  isBookmarked,
} from "@/features/bookmarks/server/bookmark-service";

/**
 * GET /api/bookmarks
 *
 * Query params:
 *   - postId (optional): Check if a specific post is bookmarked by the current user
 *
 * If postId is provided, returns { bookmarked: boolean }.
 * If postId is omitted, returns the full list of user's bookmarks with post data.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return apiResponse({ error: "Authentication required", status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (postId) {
    const bookmark = await isBookmarked(session.user.id, postId);
    return apiResponse({ data: { bookmarked: !!bookmark }, status: 200 });
  }

  const bookmarks = await getBookmarksByUserId(session.user.id);
  return apiResponse({ data: bookmarks, status: 200 });
}

/**
 * POST /api/bookmarks
 *
 * Body: { postId: string }
 *
 * Toggles the bookmark for the current user on the given post.
 * Returns { bookmarked: boolean, bookmarkId: string | null }.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return apiResponse({ error: "Authentication required", status: 401 });
  }

  let body: { postId?: string };
  try {
    body = await request.json();
  } catch {
    return apiResponse({ error: "Invalid request body", status: 400 });
  }

  if (!body.postId || typeof body.postId !== "string") {
    return apiResponse({ error: "postId is required", status: 400 });
  }

  const result = await toggleBookmark(session.user.id, body.postId);
  return apiResponse({ data: result, status: 200 });
}
```

---

### Step 5: Bookmarks Page

Create `src/app/[locale]/(main)/bookmarks/page.tsx`:

```typescript
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/features/auth/config/auth-options";
import { getBookmarksByUserId } from "@/features/bookmarks/server/bookmark-service";
import { PostCard } from "@/features/blog/components/post-card";

export const metadata = {
  title: "My Bookmarks | My Tech Memoir",
  description: "Posts you've saved for later.",
};

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const bookmarks = await getBookmarksByUserId(session.user.id);

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <h1
        className="font-serif text-2xl font-bold mb-8"
        style={{ color: "var(--ink-primary)" }}
      >
        My Bookmarks
      </h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <p style={{ color: "var(--ink-secondary)" }} className="text-lg mb-2">
            No bookmarks yet
          </p>
          <p style={{ color: "var(--ink-tertiary)" }} className="text-sm">
            Bookmark posts to save them for later.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {bookmarks.map((bookmark) => (
            <PostCard key={bookmark.id} post={bookmark.post} />
          ))}
        </div>
      )}
    </div>
  );
}
```

> **Note:** This page uses the `[locale]` route segment per the architecture. If your project hasn't set up i18n routing yet, place it at `src/app/(main)/bookmarks/page.tsx` instead and remove `[locale]` from the path.

---

### Step 6: Add "Bookmarks" Link to Header

Edit `src/components/Header.tsx` to include a bookmarks link in the navigation. Add it alongside the existing theme toggle, visible only to signed-in users:

```typescript
// Inside the Header component, add a Bookmarks link.
// You will need to use next-auth's useSession() hook to check auth state.

import { useSession } from "next-auth/react";

// Inside the component body:
const { data: session } = useSession();

// In the JSX, after the theme toggle button:
{session?.user && (
  <Link
    href="/bookmarks"
    className="text-sm transition-colors hover:underline"
    style={{ color: "var(--ink-secondary)" }}
  >
    Bookmarks
  </Link>
)}
```

Since the Header is currently a client component (`"use client"`), you can use `useSession()` directly. Wrap the Header in the SessionProvider (if not already done in the layout).

---

### Step 7: Integrate Bookmark Button in Blog Post Page

Edit the blog post detail page at `src/app/[locale]/(main)/blog/[slug]/page.tsx`.

Import and add the `BookmarkButton` in the post header area, next to the reading time or author info:

```typescript
import { BookmarkButton } from "@/features/bookmarks/components/bookmark-button";

// Inside the page component, after fetching the post:
// Pass postId to the BookmarkButton

// In the JSX, add next to other metadata:
<div className="flex items-center gap-3">
  {/* existing metadata: author, date, reading time */}
  <BookmarkButton postId={post.id} />
</div>
```

Since this is a Server Component page, but `BookmarkButton` is a Client Component (`"use client"`), the Server Component renders it and passes props — this is the correct pattern and does not break the server boundary.

---

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/features/bookmarks/types/index.ts` | **Create** | TypeScript types for bookmarks |
| `src/features/bookmarks/server/bookmark-service.ts` | **Create** | Database service (toggle, check, list) |
| `src/features/bookmarks/components/bookmark-button.tsx` | **Create** | Client-side bookmark toggle button |
| `src/app/api/bookmarks/route.ts` | **Create** | REST API (GET + POST) |
| `src/app/[locale]/(main)/bookmarks/page.tsx` | **Create** | Bookmarks listing page |
| `src/components/Header.tsx` | **Modify** | Add "Bookmarks" nav link |
| `src/app/[locale]/(main)/blog/[slug]/page.tsx` | **Modify** | Add BookmarkButton to post header |

---

## Verification Checklist

After implementation, verify:

- [ ] `npx prisma generate` succeeds (Bookmark model is in schema)
- [ ] `npm run build` compiles without errors
- [ ] `npm run lint` passes with zero warnings
- [ ] Clicking the bookmark icon on a post (while signed in) toggles the bookmark state
- [ ] Clicking the bookmark icon while signed out redirects to sign-in
- [ ] Bookmarked posts appear on `/bookmarks` page
- [ ] Empty state shows when no bookmarks exist
- [ ] "Bookmarks" link appears in the header for signed-in users
- [ ] "Bookmarks" link is hidden for signed-out users
- [ ] Unbookmarking a post removes it from the bookmarks page
- [ ] Toggle is optimistic (UI updates immediately, reverts on error)

---

## Pitfalls to Avoid

1. **Do not import server services in client components.** The `BookmarkButton` is `"use client"` and communicates only through `fetch("/api/bookmarks")`. It must never import `bookmark-service.ts`.

2. **Do not use `window.location` for navigation in the button.** Use Next.js `useRouter().push()` for SPA-style navigation if needed, but the toggle itself should not navigate.

3. **Handle the unauthenticated click gracefully.** Don't crash — redirect to sign-in or show a toast. The implementation above redirects to `/auth/signin`.

4. **Unique constraint on `(userId, postId)`.** The Prisma schema has `@@unique([userId, postId])`. The `toggleBookmark` service handles this by checking for an existing record first. Do not use `upsert` here because the toggle logic needs to differentiate between "create" and "delete."

5. **`apiResponse()` helper.** This function is defined in `src/lib/api-response.ts`. If it doesn't exist yet, create it following this signature:

   ```typescript
   type ApiResponseParams<T> = {
     data?: T;
     error?: string;
     status?: number;
   };

   export function apiResponse<T>({ data, error, status = 200 }: ApiResponseParams<T>) {
     return Response.json(
       { success: !error, data: data ?? null, error: error ?? null },
       { status }
     );
   }
   ```

6. **The `[locale]` route segment.** If i18n is not yet set up, use the non-locale version of the route path (`src/app/(main)/bookmarks/page.tsx`).

7. **Session user ID.** Ensure your NextAuth session includes the user's database `id` field. If not, extend the session callback in `auth-options.ts`:

   ```typescript
   callbacks: {
     async session({ session, user }) {
       if (session.user) {
         session.user.id = user.id;
       }
       return session;
     },
   },
   ```

---

## Done

After completing all steps, the bookmarks feature is fully functional:
- Toggle bookmarks from any blog post page
- View all saved posts at `/bookmarks`
- Clean, empty state for new users
- Auth-gated throughout
