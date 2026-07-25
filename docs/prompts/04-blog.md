# Phase 4: Blog Feature

> **Goal**: Build the blog reading and listing experience — post types, data access layer, components, pages, and API routes.

---

## Project Context

- **Framework**: Next.js 16 (App Router, React 19)
- **ORM**: Prisma 7 with Neon PostgreSQL adapter
- **Styling**: Tailwind CSS 4 (PostCSS plugin) + CSS custom properties for theming
- **Components**: shadcn/ui
- **Path alias**: `@/*` → `./src/*`
- **Prisma client**: imported from `../../generated/prisma/client` (singleton in `src/lib/db.ts`)
- **Design tokens**: CSS vars (`--bg-base`, `--ink-primary`, `--accent`, etc.) in `src/app/globals.css`
- **Prose class**: `.prose-memoir` handles article typography (serif headings, monospace code, etc.)

### Existing Schema (already created)

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  excerpt   String?
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tags      Tag[]
  @@index([published])
  @@index([createdAt(sort: Desc)])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  posts Post[]
}
```

---

## Implementation Tasks

### 1. Post Types — `src/features/blog/types/index.ts`

Create domain types that mirror the Prisma models but add convenience fields:

```typescript
import type { Post as PrismaPost, Tag as PrismaTag } from "@/generated/prisma/client";

/** Tag with only the fields the UI needs. */
export type Tag = Pick<PrismaTag, "id" | "name" | "slug">;

/** Post with relations (tags included). Used on post pages. */
export type PostWithTags = PrismaPost & {
  tags: Tag[];
};

/** Lightweight post for list views (no content body). */
export type PostSummary = Pick<
  PrismaPost,
  "id" | "title" | "slug" | "excerpt" | "published" | "createdAt" | "updatedAt"
> & {
  tags: Tag[];
};

/** Input for creating a new post. */
export type CreatePostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  published?: boolean;
  tagIds?: string[];
};

/** Input for updating an existing post. All fields optional. */
export type UpdatePostInput = Partial<CreatePostInput>;
```

---

### 2. Reading Time Utility — `src/features/blog/lib/reading-time.ts`

Write a pure function that estimates reading time from Markdown/HTML content:

```typescript
const WORDS_PER_MINUTE = 238;

/**
 * Strip HTML tags and count words to estimate reading time.
 * Returns a human-readable string like "5 min read".
 */
export function estimateReadingTime(content: string): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]+>/g, "");
  // Collapse whitespace and split on spaces
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

/**
 * Return reading time as a raw number (minutes).
 */
export function readingTimeMinutes(content: string): number {
  const text = content.replace(/<[^>]+>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
```

---

### 3. Post Service — `src/features/blog/server/post-service.ts`

All database operations go through this service. It imports `db` from `@/lib/db` and uses Prisma directly. Every function is `async` and returns typed results.

```typescript
import { db } from "@/lib/db";
import type { CreatePostInput, PostSummary, PostWithTags, UpdatePostInput } from "../types";

// ─── Query helpers ─────────────────────────────────────────

/** Select shape: everything the list page needs, no content body. */
const SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  published: true,
  createdAt: true,
  updatedAt: true,
  tags: { select: { id: true, name: true, slug: true } },
} as const;

/** Select shape: everything including the full content body. */
const FULL_SELECT = {
  ...SUMMARY_SELECT,
  content: true,
} as const;

// ─── CRUD Operations ──────────────────────────────────────

/**
 * Get all published posts, newest first.
 * Used by the blog list page.
 */
export async function getPublishedPosts(): Promise<PostSummary[]> {
  return db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  }) as Promise<PostSummary[]>;
}

/**
 * Get all posts (including drafts), newest first.
 * Used by the admin/dashboard view.
 */
export async function getAllPosts(): Promise<PostSummary[]> {
  return db.post.findMany({
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  }) as Promise<PostSummary[]>;
}

/**
 * Get a single post by its slug.
 * Returns null if not found.
 */
export async function getPostBySlug(slug: string): Promise<PostWithTags | null> {
  return db.post.findUnique({
    where: { slug },
    select: FULL_SELECT,
  }) as Promise<PostWithTags | null>;
}

/**
 * Get a single post by its ID.
 * Returns null if not found.
 */
export async function getPostById(id: string): Promise<PostWithTags | null> {
  return db.post.findUnique({
    where: { id },
    select: FULL_SELECT,
  }) as Promise<PostWithTags | null>;
}

/**
 * Create a new post.
 * Connects existing tags by ID if tagIds are provided.
 */
export async function createPost(input: CreatePostInput): Promise<PostWithTags> {
  return db.post.create({
    data: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      published: input.published ?? false,
      tags: input.tagIds?.length
        ? { connect: input.tagIds.map((id) => ({ id })) }
        : undefined,
    },
    select: FULL_SELECT,
  }) as Promise<PostWithTags>;
}

/**
 * Update an existing post by ID.
 * If tagIds is provided, replaces all tag connections.
 */
export async function updatePost(
  id: string,
  input: UpdatePostInput,
): Promise<PostWithTags> {
  const data: Record<string, unknown> = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.content !== undefined) data.content = input.content;
  if (input.published !== undefined) data.published = input.published;

  // Replace tag connections if tagIds provided
  if (input.tagIds !== undefined) {
    data.tags = { set: input.tagIds.map((id) => ({ id })) };
  }

  return db.post.update({
    where: { id },
    data,
    select: FULL_SELECT,
  }) as Promise<PostWithTags>;
}

/**
 * Delete a post by ID.
 */
export async function deletePost(id: string): Promise<void> {
  await db.post.delete({ where: { id } });
}

/**
 * Get posts by tag slug, published only.
 */
export async function getPostsByTag(tagSlug: string): Promise<PostSummary[]> {
  return db.post.findMany({
    where: {
      published: true,
      tags: { some: { slug: tagSlug } },
    },
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  }) as Promise<PostSummary[]>;
}

/**
 * Search posts by title or excerpt (case-insensitive).
 */
export async function searchPosts(query: string): Promise<PostSummary[]> {
  return db.post.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  }) as Promise<PostSummary[]>;
}
```

---

### 4. Post Card Component — `src/features/blog/components/post-card.tsx`

A Server Component that renders a single post in the blog list. Uses the existing `.prose-memoir` design tokens.

```tsx
import Link from "next/link";
import type { PostSummary } from "../types";
import { estimateReadingTime } from "../lib/reading-time";

type PostCardProps = {
  post: PostSummary;
};

export function PostCard({ post }: PostCardProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.createdAt));

  return (
    <article
      className="group rounded-lg p-5 transition-colors duration-150"
      style={{
        backgroundColor: "var(--bg-raised)",
        border: "1px solid var(--border-muted)",
      }}
    >
      <Link href={`/blog/${post.slug}`} className="block" style={{ textDecoration: "none" }}>
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs font-sans font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--bg-muted)",
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2
          className="font-serif text-xl font-semibold leading-tight mb-2 transition-colors"
          style={{ color: "var(--ink-primary)" }}
        >
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p
            className="font-sans text-sm leading-relaxed mb-3"
            style={{ color: "var(--ink-secondary)" }}
          >
            {post.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs font-sans" style={{ color: "var(--ink-tertiary)" }}>
          <time dateTime={post.createdAt.toISOString()}>{formattedDate}</time>
          <span aria-hidden="true">·</span>
          <span>{estimateReadingTime(post.content ?? "")}</span>
        </div>
      </Link>
    </article>
  );
}
```

> **Note**: The `post.content` field is available on `PostSummary` even though it's not explicitly `Pick`'d — adjust the type if needed. If `PostSummary` truly excludes `content`, either (a) add `"content"` to the `Pick`, or (b) fetch content separately in the reading-time helper. The simplest fix is to include `content` in the summary select only for the reading time computation, or compute it server-side and pass it as a prop.

**Revised approach for reading time** — since `PostSummary` intentionally excludes `content` for performance, compute reading time in the service layer:

Add to `PostSummary` type:

```typescript
export type PostSummary = Pick<
  PrismaPost,
  "id" | "title" | "slug" | "excerpt" | "content" | "published" | "createdAt" | "updatedAt"
> & {
  tags: Tag[];
  readingTime: string;
};
```

Then in `post-service.ts`, after fetching, compute:

```typescript
// In getPublishedPosts and getAllPosts:
const posts = await db.post.findMany({ ... });
return posts.map((post) => ({
  ...post,
  readingTime: estimateReadingTime(post.content),
}));
```

And update `SUMMARY_SELECT` to include `content: true`.

---

### 5. Post Header Component — `src/features/blog/components/post-header.tsx`

Server Component rendered at the top of a blog post page:

```tsx
import Link from "next/link";
import type { PostWithTags } from "../types";
import { estimateReadingTime } from "../lib/reading-time";

type PostHeaderProps = {
  post: PostWithTags;
};

export function PostHeader({ post }: PostHeaderProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.createdAt));

  return (
    <header className="mb-8 pb-6" style={{ borderBottom: "1px solid var(--border-muted)" }}>
      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/blog/tag/${tag.slug}`}
              className="text-xs font-sans font-medium px-2 py-0.5 rounded-full transition-colors"
              style={{
                backgroundColor: "var(--bg-muted)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1
        className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-4"
        style={{ color: "var(--ink-primary)" }}
      >
        {post.title}
      </h1>

      {/* Excerpt */}
      {post.excerpt && (
        <p
          className="font-sans text-lg leading-relaxed mb-4"
          style={{ color: "var(--ink-secondary)" }}
        >
          {post.excerpt}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm font-sans" style={{ color: "var(--ink-tertiary)" }}>
        <time dateTime={post.createdAt.toISOString()}>{formattedDate}</time>
        <span aria-hidden="true">·</span>
        <span>{estimateReadingTime(post.content)}</span>
      </div>
    </header>
  );
}
```

---

### 6. Blog List Page — `src/app/blog/page.tsx`

Server Component. Fetches published posts and renders them as a list.

```tsx
import type { Metadata } from "next";
import { getPublishedPosts } from "@/features/blog/server/post-service";
import { PostCard } from "@/features/blog/components/post-card";

export const metadata: Metadata = {
  title: "Blog — My Tech Memoir",
  description: "Technical articles on networking, protocols, and software engineering.",
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <h1
        className="font-serif text-3xl font-bold mb-2"
        style={{ color: "var(--ink-primary)" }}
      >
        Blog
      </h1>
      <p
        className="font-sans text-base mb-8"
        style={{ color: "var(--ink-secondary)" }}
      >
        Thoughts on networking, protocols, and building things.
      </p>

      {posts.length === 0 ? (
        <p
          className="font-sans text-center py-12"
          style={{ color: "var(--ink-tertiary)" }}
        >
          No posts yet. Check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 7. Blog Post Page — `src/app/blog/[slug]/page.tsx`

Server Component with dynamic route parameter. Fetches a single post by slug.

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/features/blog/server/post-service";
import { PostHeader } from "@/features/blog/components/post-header";

type Props = {
  params: Promise<{ slug: string }>;
};

/** Generate static params for all published posts (optional ISR/SSG). */
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

/** Dynamic metadata per post. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found — My Tech Memoir" };
  }

  return {
    title: `${post.title} — My Tech Memoir`,
    description: post.excerpt ?? `Read ${post.title} on My Tech Memoir.`,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  return (
    <article className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <PostHeader post={post} />
      <div
        className="prose-memoir"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
```

---

### 8. Tag List Page — `src/app/blog/tag/[slug]/page.tsx`

Optional but recommended — lists posts filtered by tag.

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPostsByTag } from "@/features/blog/server/post-service";
import { PostCard } from "@/features/blog/components/post-card";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await db.tag.findUnique({ where: { slug }, select: { name: true } });

  if (!tag) {
    return { title: "Tag Not Found — My Tech Memoir" };
  }

  return {
    title: `${tag.name} — My Tech Memoir`,
    description: `Posts tagged with "${tag.name}".`,
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;

  const tag = await db.tag.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!tag) {
    notFound();
  }

  const posts = await getPostsByTag(slug);

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <h1
        className="font-serif text-3xl font-bold mb-2"
        style={{ color: "var(--ink-primary)" }}
      >
        Tagged: {tag.name}
      </h1>
      <p
        className="font-sans text-base mb-8"
        style={{ color: "var(--ink-secondary)" }}
      >
        {posts.length} post{posts.length !== 1 ? "s" : ""}
      </p>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

---

### 9. Posts API Routes — `src/app/api/posts/route.ts`

RESTful API endpoints for programmatic access (useful for future admin panel, CMS integrations, or mobile app).

#### GET /api/posts — List posts

```typescript
import { NextResponse } from "next/server";
import { getPublishedPosts, getAllPosts } from "@/features/blog/server/post-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeDrafts = searchParams.get("drafts") === "true";

  const posts = includeDrafts ? await getAllPosts() : await getPublishedPosts();

  return NextResponse.json(posts);
}
```

#### POST /api/posts — Create post

```typescript
import { NextResponse } from "next/server";
import { createPost } from "@/features/blog/server/post-service";
import type { CreatePostInput } from "@/features/blog/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePostInput;

    // Basic validation
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: "title, slug, and content are required" },
        { status: 400 },
      );
    }

    const post = await createPost(body);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
```

#### GET/PUT/DELETE /api/posts/[id] — Single post operations

Create file: `src/app/api/posts/[id]/route.ts`

```typescript
import { NextResponse } from "next/server";
import {
  getPostById,
  updatePost,
  deletePost,
} from "@/features/blog/server/post-service";
import type { UpdatePostInput } from "@/features/blog/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdatePostInput;
    const post = await updatePost(id, body);
    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to update post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deletePost(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
```

---

## File Structure Summary

```
src/
├── app/
│   ├── api/
│   │   └── posts/
│   │       ├── route.ts              # GET (list) + POST (create)
│   │       └── [id]/
│   │           └── route.ts          # GET / PUT / DELETE by ID
│   └── blog/
│       ├── page.tsx                  # Blog list (Server Component)
│       ├── [slug]/
│       │   └── page.tsx              # Blog post (Server Component)
│       └── tag/
│           └── [slug]/
│               └── page.tsx          # Posts by tag
└── features/
    └── blog/
        ├── types/
        │   └── index.ts             # PostSummary, PostWithTags, CreatePostInput, etc.
        ├── lib/
        │   └── reading-time.ts      # estimateReadingTime(), readingTimeMinutes()
        ├── server/
        │   └── post-service.ts      # All DB operations (CRUD, search, by-tag)
        └── components/
            ├── post-card.tsx         # Card for blog list (Server Component)
            └── post-header.tsx       # Header for blog post page (Server Component)
```

---

## Key Decisions & Notes

1. **Server Components everywhere** — All blog components are Server Components (no `"use client"`). This keeps JS bundle small and leverages React Server Components for fast page loads.

2. **Content is rendered as HTML** — The post `content` field stores HTML. The blog post page uses `dangerouslySetInnerHTML` with the `.prose-memoir` class handling typography. This is safe because only admin-authored content enters the DB. If you add a Tiptap editor later, it already outputs HTML.

3. **No Tiptap editor in this phase** — The spec mentions Tiptap but that belongs in the admin/editor phase. This phase focuses on the reading experience. The `content` field accepts HTML strings.

4. **`generateStaticParams`** — The blog post page generates static params for all published posts. This enables static generation at build time. In production, pair with `revalidate` if you want ISR.

5. **Reading time is computed server-side** — Avoids shipping content to the client just for a word count.

6. **API routes are optional but included** — They don't interfere with the Server Component pages and provide a clean REST interface for future features (admin panel, RSS, mobile app).

7. **Shadcn/ui not used yet** — The components here are hand-styled with the project's CSS variables to match the existing aesthetic. When shadcn/ui is installed (Phase 3 was supposed to set it up), you can swap in `<Card>`, `<Badge>`, `<Button>` etc.

---

## Verification Steps

After implementation, run these checks:

```bash
# 1. TypeScript compiles cleanly
npx tsc --noEmit

# 2. Build succeeds
npm run build

# 3. Start dev server and verify pages
npm run dev
# → http://localhost:3000/blog          (empty state message)
# → http://localhost:3000/api/posts     (empty array [])

# 4. Seed a test post via API
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello World",
    "slug": "hello-world",
    "excerpt": "My first blog post.",
    "content": "<p>This is the content of my first post.</p>",
    "published": true
  }'

# 5. Verify it appears on the blog list
curl http://localhost:3000/api/posts

# 6. Verify the post page renders
# → http://localhost:3000/blog/hello-world

# 7. Verify the post detail API
curl http://localhost:3000/api/posts/<id-from-step-4>
```
