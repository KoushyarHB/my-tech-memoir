# Phase 5: Comments

> Self-contained implementation prompt for an AI coding agent.
> Copy-paste this entire document into any agent to build the comment system.

---

## Overview

Build a comment system for blog posts that supports both **anonymous** and **authenticated** users. Anonymous comments require a name and optional email. Authenticated comments use the session from Phase 2 (NextAuth.js). Comments are scoped to individual posts.

---

## 1. Prisma Schema — Comment Model

Add the `Comment` model to `prisma/schema.prisma`. It must relate to `Post` via a foreign key. Anonymous comments store `authorName` / `authorEmail` directly; authenticated comments link to a `User` via `userId`.

```prisma
// ─── Comments ────────────────────────────────────────────

model Comment {
  id          String   @id @default(cuid())
  content     String
  authorName  String?  // anonymous: display name
  authorEmail String?  // anonymous: email (not shown publicly)
  userId      String?  // authenticated: FK to User

  published   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  postId String
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId, createdAt(sort: Asc)])
}
```

Update the `Post` model to include the relation:

```prisma
model Post {
  // ... existing fields ...

  tags    Tag[]
  comments Comment[]

  // ... existing indexes unchanged ...
}
```

If Phase 2 (Auth) has been implemented and a `User` model exists, add the reverse relation:

```prisma
model User {
  // ... existing fields ...
  comments Comment[]
}
```

After editing the schema, run:

```bash
npx prisma migrate dev --name add-comments
npx prisma generate
```

---

## 2. Comment Types (`src/types/comment.ts`)

Create a shared types file:

```ts
// src/types/comment.ts

/** Shape returned by the API — safe to send to the client. */
export interface CommentPayload {
  id: string;
  content: string;
  authorName: string;          // display name (user or anonymous)
  authorEmail: string | null;  // only present for the comment owner
  userId: string | null;
  published: boolean;
  createdAt: string;           // ISO 8601
}

/** Shape submitted by the comment form. */
export interface CommentFormData {
  content: string;
  authorName?: string;   // required for anonymous
  authorEmail?: string;  // optional for anonymous
}

/** API error shape. */
export interface CommentApiError {
  error: string;
  details?: string[];
}
```

---

## 3. Comment Service (`src/lib/comments.ts`)

A thin service layer that wraps Prisma queries. Keeps API routes thin and testable.

```ts
// src/lib/comments.ts

import { db } from "@/lib/db";
import type { CommentPayload } from "@/types/comment";

/**
 * Fetch all published comments for a post, ordered oldest-first.
 * Returns a safe payload (no authorEmail unless requested).
 */
export async function getCommentsByPostId(
  postId: string,
): Promise<CommentPayload[]> {
  const comments = await db.comment.findMany({
    where: { postId, published: true },
    orderBy: { createdAt: "asc" },
  });

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    authorName: c.authorName ?? "Anonymous",
    authorEmail: null, // never exposed in listing
    userId: c.userId,
    published: c.published,
    createdAt: c.createdAt.toISOString(),
  }));
}

/**
 * Create a new comment. Pass userId for authenticated, or authorName/authorEmail for anonymous.
 */
export async function createComment(params: {
  postId: string;
  content: string;
  userId?: string | null;
  authorName?: string;
  authorEmail?: string;
}): Promise<CommentPayload> {
  const comment = await db.comment.create({
    data: {
      postId: params.postId,
      content: params.content,
      userId: params.userId ?? null,
      authorName: params.userId ? null : (params.authorName ?? "Anonymous"),
      authorEmail: params.userId ? null : (params.authorEmail ?? null),
      published: true,
    },
  });

  return {
    id: comment.id,
    content: comment.content,
    authorName: comment.authorName ?? "Anonymous",
    authorEmail: null,
    userId: comment.userId,
    published: comment.published,
    createdAt: comment.createdAt.toISOString(),
  };
}

/**
 * Soft-delete a comment (owner or admin only).
 */
export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<boolean> {
  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment) return false;
  if (comment.userId !== userId) return false; // not the owner

  await db.comment.delete({ where: { id: commentId } });
  return true;
}
```

---

## 4. Comments API Route (`src/app/api/comments/route.ts`)

A single route handling **GET** (list) and **POST** (create). The route is scoped via query parameter `?postId=xxx`.

```ts
// src/app/api/comments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCommentsByPostId, createComment } from "@/lib/comments";
import type { CommentFormData } from "@/types/comment";

// ─── GET /api/comments?postId=xxx ───────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json(
      { error: "Missing postId query parameter" },
      { status: 400 },
    );
  }

  try {
    const comments = await getCommentsByPostId(postId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

// ─── POST /api/comments ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: CommentFormData & { postId?: string } = await request.json();
    const { postId, content, authorName, authorEmail } = body;

    // Validation
    const errors: string[] = [];
    if (!postId) errors.push("postId is required");
    if (!content || content.trim().length === 0) errors.push("content is required");
    if (content && content.length > 2000) errors.push("content must be 2000 characters or fewer");

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Check if the post exists
    const { db } = await import("@/lib/db");
    const post = await db.post.findUnique({ where: { id: postId! } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // TODO: When Phase 2 (Auth) is implemented, replace this block with:
    //   import { getServerSession } from "next-auth";
    //   const session = await getServerSession();
    //   const userId = session?.user?.id ?? null;
    // For now, always treat as anonymous.
    const userId = null;

    const comment = await createComment({
      postId: postId!,
      content: content!.trim(),
      userId,
      authorName: authorName?.trim() || "Anonymous",
      authorEmail: authorEmail?.trim() || undefined,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
```

---

## 5. Comment Components

### 5a. CommentList — `src/components/comments/CommentList.tsx`

Displays all comments for a post. Fetches data client-side via `useEffect` so it stays out of the server-rendered page.

```tsx
// src/components/comments/CommentList.tsx
"use client";

import { useEffect, useState } from "react";
import type { CommentPayload } from "@/types/comment";

interface CommentListProps {
  postId: string;
  refreshKey?: number; // increment to trigger refetch after a new comment
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommentList({ postId, refreshKey }: CommentListProps) {
  const [comments, setComments] = useState<CommentPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchComments() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/comments?postId=${postId}`);
        if (!res.ok) throw new Error("Failed to load comments");
        const data = await res.json();
        if (!cancelled) setComments(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchComments();
    return () => { cancelled = true; };
  }, [postId, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg p-4 animate-pulse"
            style={{ backgroundColor: "var(--bg-muted)", border: "1px solid var(--border-muted)" }}
          >
            <div className="h-3 w-24 rounded mb-2" style={{ backgroundColor: "var(--border)" }} />
            <div className="h-3 w-full rounded mb-1" style={{ backgroundColor: "var(--border)" }} />
            <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--border)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm font-sans" style={{ color: "var(--ink-tertiary)" }}>
        Could not load comments: {error}
      </p>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm font-sans italic" style={{ color: "var(--ink-tertiary)" }}>
        No comments yet. Be the first to share your thoughts.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="rounded-lg p-4"
          style={{
            backgroundColor: "var(--bg-raised)",
            border: "1px solid var(--border-muted)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            {/* Avatar placeholder — first letter of name */}
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold font-sans"
              style={{
                backgroundColor: "var(--accent-muted)",
                color: "var(--bg-base)",
              }}
              aria-hidden="true"
            >
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold font-sans" style={{ color: "var(--ink-primary)" }}>
              {comment.authorName}
            </span>
            <span className="text-xs font-sans" style={{ color: "var(--ink-tertiary)" }}>
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm font-sans leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink-secondary)" }}>
            {comment.content}
          </p>
        </article>
      ))}
    </div>
  );
}
```

### 5b. CommentForm — `src/components/comments/CommentForm.tsx`

A form that works for both anonymous and (future) authenticated users. When anonymous, requires a name; optionally collects email. Shows auth status when logged in.

```tsx
// src/components/comments/CommentForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import type { CommentFormData } from "@/types/comment";

interface CommentFormProps {
  postId: string;
  onCommentPosted?: () => void; // triggers refresh in CommentList
}

export default function CommentForm({ postId, onCommentPosted }: CommentFormProps) {
  const [formData, setFormData] = useState<CommentFormData>({
    content: "",
    authorName: "",
    authorEmail: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // TODO: When Phase 2 is implemented, derive these from session:
  //   const { data: session } = useSession();
  //   const isAuthenticated = !!session?.user;
  const isAuthenticated = false;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const content = formData.content.trim();
    if (!content) {
      setError("Please write a comment before submitting.");
      return;
    }

    if (!isAuthenticated && !formData.authorName?.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, ...formData, content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }

      setFormData({ content: "", authorName: "", authorEmail: "" });
      setSuccess(true);
      onCommentPosted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--bg-raised)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <h3
        className="text-base font-semibold font-serif mb-4"
        style={{ color: "var(--ink-primary)" }}
      >
        {isAuthenticated ? "Leave a comment" : "Leave a comment as guest"}
      </h3>

      {/* Anonymous fields — hidden when authenticated */}
      {!isAuthenticated && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label
              htmlFor="comment-author"
              className="block text-xs font-medium font-sans mb-1"
              style={{ color: "var(--ink-secondary)" }}
            >
              Name <span style={{ color: "var(--accent)" }}>*</span>
            </label>
            <input
              id="comment-author"
              type="text"
              required
              maxLength={100}
              value={formData.authorName}
              onChange={(e) => setFormData((p) => ({ ...p, authorName: e.target.value }))}
              placeholder="Your name"
              className="w-full rounded-md px-3 py-2 text-sm font-sans outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--ink-primary)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="comment-email"
              className="block text-xs font-medium font-sans mb-1"
              style={{ color: "var(--ink-secondary)" }}
            >
              Email <span className="font-normal" style={{ color: "var(--ink-tertiary)" }}>(optional, not shown)</span>
            </label>
            <input
              id="comment-email"
              type="email"
              maxLength={254}
              value={formData.authorEmail}
              onChange={(e) => setFormData((p) => ({ ...p, authorEmail: e.target.value }))}
              placeholder="you@example.com"
              className="w-full rounded-md px-3 py-2 text-sm font-sans outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--ink-primary)",
              }}
            />
          </div>
        </div>
      )}

      {/* Content textarea */}
      <div className="mb-3">
        <label
          htmlFor="comment-content"
          className="block text-xs font-medium font-sans mb-1"
          style={{ color: "var(--ink-secondary)" }}
        >
          Comment <span style={{ color: "var(--accent)" }}>*</span>
        </label>
        <textarea
          id="comment-content"
          required
          maxLength={2000}
          rows={4}
          value={formData.content}
          onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
          placeholder="Share your thoughts…"
          className="w-full rounded-md px-3 py-2 text-sm font-sans leading-relaxed outline-none transition-colors resize-y"
          style={{
            backgroundColor: "var(--bg-base)",
            border: "1px solid var(--border)",
            color: "var(--ink-primary)",
          }}
        />
        <p
          className="text-right text-xs font-sans mt-1"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {formData.content.length}/2000
        </p>
      </div>

      {/* Feedback messages */}
      {error && (
        <p className="text-sm font-sans mb-3" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm font-sans mb-3" style={{ color: "#34d399" }}>
          Comment posted!
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md px-4 py-2 text-sm font-semibold font-sans transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--bg-base)",
        }}
      >
        {submitting ? "Posting…" : "Post Comment"}
      </button>
    </form>
  );
}
```

### 5c. Barrel export — `src/components/comments/index.ts`

```ts
export { default as CommentList } from "./CommentList";
export { default as CommentForm } from "./CommentForm";
```

---

## 6. Integration in Blog Post Page

Assuming Phase 4 created a dynamic blog post page at `src/app/posts/[slug]/page.tsx`, add the comment components below the article content:

```tsx
// Inside the blog post page component, after the </article> tag:

import { CommentList, CommentForm } from "@/components/comments";

// Inside the page component (this is a Server Component by default):
// You need to pass postId to client components. Extract it in a wrapper or use Suspense.

// Option A — dedicated client wrapper (recommended):
// Create src/components/comments/CommentSection.tsx as a client component that
// receives postId and manages the refreshKey state internally.
```

For a clean integration, create one more component:

### CommentSection — `src/components/comments/CommentSection.tsx`

```tsx
// src/components/comments/CommentSection.tsx
"use client";

import { useState } from "react";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section
      className="mt-10 pt-8"
      style={{ borderTop: "1px solid var(--border-muted)" }}
    >
      <h2
        className="text-xl font-semibold font-serif mb-6"
        style={{ color: "var(--ink-primary)" }}
      >
        Comments
      </h2>

      <CommentForm
        postId={postId}
        onCommentPosted={() => setRefreshKey((k) => k + 1)}
      />

      <div className="mt-8">
        <CommentList postId={postId} refreshKey={refreshKey} />
      </div>
    </section>
  );
}
```

Update the barrel export:

```ts
// src/components/comments/index.ts
export { default as CommentList } from "./CommentList";
export { default as CommentForm } from "./CommentForm";
export { default as CommentSection } from "./CommentSection";
```

Then in the blog post page (Server Component):

```tsx
import { CommentSection } from "@/components/comments";

// After the article content, inside the return:
// <CommentSection postId={post.id} />
```

---

## 7. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | **modify** | Add Comment model, update Post (and User if exists) relations |
| `src/types/comment.ts` | **create** | Shared TypeScript interfaces |
| `src/lib/comments.ts` | **create** | Comment service (CRUD via Prisma) |
| `src/app/api/comments/route.ts` | **create** | GET + POST API route |
| `src/components/comments/CommentList.tsx` | **create** | Client component: renders comment thread |
| `src/components/comments/CommentForm.tsx` | **create** | Client component: comment input form |
| `src/components/comments/CommentSection.tsx` | **create** | Client component: orchestrates list + form |
| `src/components/comments/index.ts` | **create** | Barrel re-exports |
| `src/app/posts/[slug]/page.tsx` | **modify** | Add `<CommentSection postId={post.id} />` |

---

## 8. Verification

After implementing, verify these checks:

```bash
# 1. Prisma generates without errors
npx prisma generate

# 2. Dev server starts
npm run dev

# 3. Build succeeds
npm run build

# 4. Manual test — create a comment via curl
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"postId":"<real-post-id>","content":"Test comment","authorName":"Tester"}'

# 5. Manual test — fetch comments
curl "http://localhost:3000/api/comments?postId=<real-post-id>"

# 6. Load a blog post in the browser and verify:
#    - Comment form renders with name/email/content fields
#    - Submitting a comment updates the list without page reload
#    - Error states display correctly (empty name, empty content)
```

---

## 9. Notes

- **Auth integration**: The POST route has a `TODO` comment for Phase 2 session integration. When auth is ready, uncomment and wire up `getServerSession()`.
- **Rate limiting**: Not included in this phase. Add in Phase 8 (Polish) if needed.
- **Moderation**: All comments default to `published: true`. Admin moderation can be added later.
- **Styling**: All components use the project's CSS custom properties (`var(--bg-raised)`, `var(--ink-primary)`, etc.) so they inherit dark/light theme automatically. No Tailwind color classes needed.
- **No shadcn/ui dependencies**: This phase intentionally uses plain HTML inputs/textareas styled with CSS variables to avoid adding shadcn/ui component complexity. shadcn/ui form components can replace these in Phase 8 if desired.
