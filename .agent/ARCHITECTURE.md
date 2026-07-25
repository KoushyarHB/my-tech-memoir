# ARCHITECTURE.md — my-tech-memoir

## Tech Stack

### Core
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.10 |
| React | React | 19.2.7 |
| Language | TypeScript | 5.8.3 |
| ORM | Prisma | 7.8.0 |
| Database | Neon PostgreSQL (serverless) | — |
| Styling | Tailwind CSS | 4.1.11 |
| Components | shadcn/ui | latest |

### Content & Editing
| Purpose | Technology |
|---------|-----------|
| Rich text editor | Tiptap (WYSIWYG → Markdown output) |
| Content storage | Markdown/MDX stored in PostgreSQL |
| Image uploads | Vercel Blob or S3 (Tiptap integration) |
| Multilingual | next-intl |
| Comments | Custom (anonymous + authenticated) |

### Auth & Hosting
| Purpose | Technology |
|---------|-----------|
| Authentication | NextAuth.js (Auth.js) — Google, Email, Phone, Magic link |
| Hosting | Vercel |
| Analytics | Vercel Analytics |

### Dev Tooling
| Purpose | Technology |
|---------|-----------|
| Package manager | npm |
| Linting | ESLint + Prettier (strict, zero warnings) |
| Testing | Vitest (unit) + Playwright (e2e) |

---

## Database Schema

### ER Diagram (Simplified)

```
User ──< Bookmark >── Post ──< PostTag >── Tag
 │                         │
 │                         └──< PostCategory >── Category
 │                         │
 │                         └──< Comment
 │
 └──< PostAuthor >── Post
                        │
                        └──< Translation
```

### Models

#### User (managed by NextAuth.js)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Optional |
| email | String | Unique, required |
| image | String | Avatar URL |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### Post
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| title | String | Required |
| slug | String | Unique, required |
| content | Text | Markdown/MDX stored in DB |
| excerpt | String | Optional, auto-generated if empty |
| coverImage | String | Optional |
| status | Enum | `DRAFT` / `PUBLISHED` / `ARCHIVED` |
| publishedAt | DateTime | Nullable |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

#### PostAuthor (Many-to-Many)
| Field | Type | Notes |
|-------|------|-------|
| postId | UUID | FK → Post |
| authorId | UUID | FK → User |
| role | Enum | `PRIMARY` / `CONTRIBUTOR` |
| [composite PK] | — | postId + authorId |

#### Category
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Unique, required |
| slug | String | Unique, required |
| description | String | Optional |

#### Tag
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Unique, required |
| slug | String | Unique, required |
| description | String | Optional |

#### PostCategory (Many-to-Many)
| Field | Type | Notes |
|-------|------|-------|
| postId | UUID | FK → Post |
| categoryId | UUID | FK → Category |
| [composite PK] | — | postId + categoryId |

#### PostTag (Many-to-Many)
| Field | Type | Notes |
|-------|------|-------|
| postId | UUID | FK → Post |
| tagId | UUID | FK → Tag |
| [composite PK] | — | postId + tagId |

#### Comment
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| postId | UUID | FK → Post |
| authorId | UUID | Nullable (null = anonymous) |
| authorName | String | For anonymous commenters |
| authorEmail | String | For anonymous, not displayed |
| content | Text | Required |
| status | Enum | `PENDING` / `APPROVED` / `SPAM` |
| createdAt | DateTime | Auto |

#### Bookmark
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| postId | UUID | FK → Post |
| createdAt | DateTime | Auto |
| [composite PK] | — | userId + postId |

#### Translation
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| postId | UUID | FK → Post |
| locale | String | Required (e.g., "fa", "es") |
| title | String | Translated title |
| content | Text | Translated content |
| excerpt | String | Optional |
| [composite PK] | — | postId + locale |

---

## API Contracts

### Approach: Hybrid

Server Components for pages (fast, SEO-friendly). API routes for interactions and future mobile app.

### Data Fetching Pattern

| Data Type | Method | Example |
|-----------|--------|---------|
| Blog posts | Server Component | Direct DB query in page component |
| Author profiles | Server Component | Direct DB query |
| Tags/categories | Server Component | Direct DB query |
| Comments (read) | Server Component | Direct DB query |
| Comments (write) | API Route | `POST /api/comments` |
| Bookmarks | API Route | `POST /api/bookmarks` |
| Image uploads | API Route | `POST /api/upload` |

### API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | * | Public | NextAuth handler |
| `/api/posts` | GET | Public | List posts |
| `/api/posts` | POST | Author | Create post |
| `/api/posts/[id]` | GET | Public | Get post |
| `/api/posts/[id]` | PUT | Author | Update post |
| `/api/posts/[id]` | DELETE | Author | Delete post |
| `/api/posts/[id]/comments` | GET | Public | List comments |
| `/api/posts/[id]/comments` | POST | Auth optional | Create comment |
| `/api/bookmarks` | GET | Auth | List bookmarks |
| `/api/bookmarks` | POST | Auth | Toggle bookmark |

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

---

## Design Tokens

*Inspired by lee.robinson (leerob.io)*

### Color Palette (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | #FFFFFF | Page background |
| Foreground | #171717 | Near-black text |
| Muted | #A1A1AA | Gray for secondary text |
| Primary | #0070F3 | Blue for links/accents |
| Border | #EAEAEA | Subtle borders |

### Color Palette (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | #000000 | Pure black |
| Foreground | #EDEDED | Light text |
| Muted | #888888 | Gray for secondary |
| Primary | #0070F3 | Same blue |
| Border | #333333 | Dark borders |

### Typography

- Font: Inter (Google Fonts)
- H1: 36px, weight 700, line-height 1.2
- H2: 30px, weight 600, line-height 1.3
- H3: 24px, weight 600, line-height 1.4
- Body: 16px, weight 400, line-height 1.6
- Small: 14px, weight 400, line-height 1.5

### Spacing

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

### Border Radius

| Token | Value |
|-------|-------|
| sm | 4px |
| md | 8px |
| lg | 12px |
| full | 9999px |

### Max Widths

| Element | Width |
|---------|-------|
| Content (blog posts) | 650px |
| Wide layout | 1024px |
| Full width | 1280px |

---

## Folder Structure & Architectural Considerations

*Full architecture blueprint below — merged from the detailed architecture document.*

---

### 1. Architectural Philosophy & Hybrid Model

The project utilizes a Feature-Based (Vertical Slice) Architecture on top of Next.js 16 App Router, configured with a Hybrid Data Fetching Strategy:

1. **Server-Rendered Content (RSCs):** Blog posts, author pages, public feeds, and page layouts run as React Server Components (RSC). They fetch data directly on the server via Prisma, producing zero client-side JavaScript bundle weight for static content display.

2. **REST API-Driven Mutations & External Endpoints:** Interactive features (comment submissions, toggling bookmarks, authentication, and mobile clients) execute via traditional JSON REST routes under `src/app/api/*`.

#### Core Principles

* **Locality of Behavior:** Code that changes together lives together. Feature-specific components, hooks, server queries, types, and utilities stay inside their domain module in `src/features/[feature]`.

* **Thin, Expressive Routes (`src/app`):** Route files act as the conductor. `page.tsx` files handle server-side data fetching, layout structure, metadata generation, and routing edge cases (`notFound()`, `redirect()`). They assemble components imported from `features/` and `components/`.

* **Shared Business Services (`src/features/*/server`):** Database queries and core domain rules are written *once* in server-only service modules and reused seamlessly by both RSC `page.tsx` handlers and REST API `route.ts` handlers.

* **Clean Design Primitive Isolation:** Pure, domain-agnostic UI building blocks live strictly in `src/components/ui/` (shadcn) and are decoupled from domain logic.

---

### 2. Directory Structure

```text
my-tech-memoir/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── middleware.ts                   # Auth guard + next-intl routing
├── next.config.mjs
├── package.json
├── tsconfig.json
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma              # Prisma 7 schema definition
│
├── messages/                       # Global i18n translation JSONs
│   ├── en.json
│   └── es.json
│
├── public/                         # Static assets (favicons, og-fallback, images)
│   └── images/
│
└── src/
    ├── app/                        # App Router (Routing, Data Orchestration & API)
    │   ├── [locale]/               # i18n dynamic route segment
    │   │   ├── (main)/             # Route group: public blog layout
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx        # Home / Feed (RSC Direct Fetch)
    │   │   │   ├── blog/
    │   │   │   │   ├── page.tsx    # Post listing (RSC Direct Fetch)
    │   │   │   │   └── [slug]/
    │   │   │   │       └── page.tsx# Single post detail (Assembly point - RSC)
    │   │   │   ├── authors/
    │   │   │   │   └── [id]/
    │   │   │   │       └── page.tsx
    │   │   │   └── bookmarks/
    │   │   │       └── page.tsx    # User bookmarks page
    │   │   └── (auth)/             # Route group: isolated auth layout
    │   │       ├── signin/
    │   │       │   └── page.tsx
    │   │       └── error/
    │   │           └── page.tsx
    │   │
    │   ├── api/                    # REST API Endpoints (Mutations + Mobile)
    │   │   ├── auth/
    │   │   │   └── [...nextauth]/
    │   │   │       └── route.ts    # NextAuth dynamic handler
    │   │   ├── posts/
    │   │   │   ├── route.ts        # GET /api/posts, POST /api/posts
    │   │   │   └── [id]/
    │   │   │       ├── route.ts    # GET, PUT, DELETE
    │   │   │       └── comments/
    │   │   │           └── route.ts# POST /api/posts/[id]/comments
    │   │   └── bookmarks/
    │   │       └── route.ts        # GET /api/bookmarks, POST /api/bookmarks
    │   │
    │   ├── favicon.ico
    │   ├── globals.css             # Tailwind v4 imports & CSS variables
    │   ├── layout.tsx              # Root layout (fonts, providers)
    │   └── not-found.tsx
    │
    ├── components/                 # Global Domain-Agnostic UI
    │   ├── ui/                     # Unmodified shadcn/ui primitives
    │   │   ├── button.tsx
    │   │   ├── dialog.tsx
    │   │   └── input.tsx
    │   ├── layout/                 # Global site frame
    │   │   ├── header.tsx
    │   │   ├── footer.tsx
    │   │   ├── navigation.tsx
    │   │   └── theme-toggle.tsx
    │   └── providers/              # React Context Providers
    │       ├── theme-provider.tsx
    │       ├── session-provider.tsx
    │       └── i18n-provider.tsx
    │
    ├── features/                   # Domain Modules (Vertical Slices)
    │   ├── blog/
    │   │   ├── components/         # Domain-aware UI
    │   │   │   ├── post-card.tsx
    │   │   │   ├── post-header.tsx
    │   │   │   ├── tiptap-editor.tsx
    │   │   │   └── reading-time.tsx
    │   │   ├── hooks/              # Blog specific hooks
    │   │   │   └── use-post.ts
    │   │   ├── server/             # Shared Server Services (Prisma DB access)
    │   │   │   └── post-service.ts
    │   │   ├── types/              # Feature TypeScript definitions
    │   │   │   └── index.ts
    │   │   └── utils/              # Niche helpers (markdown, reading time)
    │   │       └── calculate-reading-time.ts
    │   │
    │   ├── comments/
    │   │   ├── components/
    │   │   │   ├── comment-list.tsx
    │   │   │   └── comment-form.tsx
    │   │   ├── server/
    │   │   │   └── comment-service.ts
    │   │   └── types/
    │   │       └── index.ts
    │   │
    │   ├── bookmarks/
    │   │   ├── components/
    │   │   │   └── bookmark-button.tsx
    │   │   └── server/
    │   │       └── bookmark-service.ts
    │   │
    │   └── auth/
    │       ├── components/
    │       │   ├── sign-in-form.tsx
    │       │   └── social-buttons.tsx
    │       └── config/
    │           └── auth-options.ts # NextAuth.js configuration
    │
    ├── lib/                        # Singletons, clients & global utilities
    │   ├── db.ts                   # Prisma client singleton
    │   ├── api-response.ts         # REST API JSON response helper
    │   └── utils.ts                # cn() helper & class merger
    │
    ├── i18n/                       # i18n config (next-intl setup)
    │   ├── request.ts
    │   └── routing.ts
    │
    └── types/                      # App-wide global TypeScript types
        └── api.ts                  # Standard API response interfaces
```

---

### 3. Deep-Dive: Architectural Implications of the Hybrid Approach

#### 3.1 Performance Implications

* **Zero-Bundle-Size Rendering:** Markdown rendering engine (Tiptap-to-HTML parser), syntax highlighters (e.g., Shiki/Prism), and reading time calculators run strictly on the server. The client browser receives pre-rendered HTML/CSS, reducing initial JS execution time to near zero.

* **Core Web Vitals Impact:**
  * **LCP (Largest Contentful Paint):** Dramatically improved because post contents are directly rendered in initial HTML, avoiding the typical client-side fetch waterfall (HTML → JS → API Call → Render).
  * **INP (Interaction to Next Paint):** Optimized by isolating heavy UI libraries. Interactivity JS is loaded only for interactive components (e.g., BookmarkButton, CommentForm).
  * **CLS (Cumulative Layout Shift):** Completely eliminated for main content reads, as server-rendered HTML eliminates layout reflows caused by async client-side data spinners.

* **TTFB (Time To First Byte) Considerations:**
  * Since Neon PostgreSQL is a serverless database connection, direct Prisma calls within serverless RSC functions execute with sub-millisecond database pooling latencies when deployed on Vercel regions close to the DB cluster.
  * *Streaming Suspense:* Wrap slow dynamic components (like the live comment stream) in `<Suspense>` boundaries to stream critical post content immediately while dynamic components stream in parallel.

#### 3.2 SEO Implications

* **Full Pre-Rendering for Crawlers:** Search engine crawlers (Googlebot, Bingbot) receive 100% complete HTML text, headings, meta tags, and Open Graph cards without needing to execute client-side JavaScript.

* **Dynamic Route Pre-rendering (`/blog/[slug]`):** Combining RSCs with `generateStaticParams()` allows Next.js to statically build high-traffic blog posts at deploy time or incrementally regenerate them (ISR) in the background.

* **Structured Data & Open Graph:** `generateMetadata()` in Next.js 16 reads post data directly from `features/blog/server/post-service.ts` on the server, generating canonical links, JSON-LD schema, and OG images cleanly before responding to requests.

#### 3.3 Data Fetching Patterns & Boundary Rules

| Data Goal | Pattern to Use | Code Location | Execution Context |
|-----------|---------------|---------------|-------------------|
| Initial Page Render (Feed, Post Detail, Profile) | Server Component (RSC) | `src/app/[locale]/(main)/**/page.tsx` | Direct call to `features/[domain]/server/*` |
| **Data Mutation** (Post comment, Toggle bookmark) | API Route | `src/app/api/**/route.ts` | Client component calls `fetch('/api/...')` |
| **External Client Fetch** (Future Mobile App) | API Route | `src/app/api/**/route.ts` | Mobile client issues REST request |

**Boundary Rules:**

1. **Rule of Direct DB Access:** `page.tsx` files and API `route.ts` files MAY call `features/*/server/*` services directly.

2. **Rule of No Self-Fetching:** An RSC (`page.tsx`) must NEVER issue an HTTP `fetch('https://site.com/api/posts')` to its own internal API routes. It must import and call the server service directly.

3. **Client Component Rule:** Client components (`'use client'`) must NEVER import from `features/*/server/*`. They must communicate through `/api/*` endpoints.

#### 3.4 Security Implications

* **Zero Leakage of Secrets:** Database credentials, private API keys, and internal service logic remain safely in `features/*/server/*` and are never exposed to browser bundles.

* **API Boundary Hardening:** Because REST endpoints in `src/app/api/` are public surfaces, every route handler must explicitly execute:
  1. Input validation using Zod schemas (`src/features/[domain]/schemas`).
  2. Authentication verification via NextAuth/Auth.js.
  3. Sanitization of rich-text/HTML content (preventing XSS in anonymous comments).

* **Cross-Site Request Forgery (CSRF):** Handled natively by NextAuth session tokens for web clients, with SameSite cookie attributes.

#### 3.5 Mobile App & API Integration Strategy

* **Shared Backend Foundation:** By using standard REST endpoints (`/api/posts`, `/api/comments`, `/api/bookmarks`) instead of Next.js Server Actions, your web app and future mobile app share the exact same mutation endpoints.

* **Mobile-Friendly Design Specs:**
  * **Standardized JSON Schema:** All API routes use `apiResponse({ data, error, status })` from `src/lib/api-response.ts`.
  * **Pagination:** API list endpoints support `limit/offset` or cursor-based pagination parameters (`?limit=10&cursor=...`).

* **Dual Auth Strategy (Web Cookies vs Mobile Tokens):**
  * **Web Application:** Uses HTTP-only session cookies via NextAuth.js.
  * **Mobile App:** Uses OAuth 2.0 / Bearer Tokens (JWT) passed in the `Authorization: Bearer <token>` header. NextAuth's `getToken()` helper validates both cookies and JWT headers in API routes seamlessly.

#### 3.6 Code Organization & Logic Sharing

Do not duplicate database or validation logic across page renders and API endpoints. Extract the business logic into the feature's `server/` directory:

```
               ┌───────────────────────────────┐
               │   src/lib/db.ts (Prisma Client)│
               └───────────────┬───────────────┘
                               │
               ┌───────────────▼───────────────┐
               │ features/comments/server/     │
               │      comment-service.ts       │
               └───────┬───────────────┬───────┘
                       │               │
      Direct Server    │               │ Direct Server
      Import Call      │               │ Import Call
                       │               │
┌──────────────────────▼───────┐  ┌────▼─────────────────────────┐
│ src/app/[locale]/blog/[slug]/│  │ src/app/api/posts/[id]/      │
│ page.tsx (RSC - Page Render) │  │ comments/route.ts (API)      │
└──────────────────────────────┘  └──────────────────────────────┘
```

**Shared Service Example (`src/features/comments/server/comment-service.ts`):**

```typescript
import { db } from "@/lib/db";

export async function createComment(data: {
  postId: string;
  content: string;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
}) {
  return await db.comment.create({
    data: {
      ...data,
      status: "PENDING", // Moderation default
    },
  });
}
```

#### 3.7 Trade-offs & Limitations

| Advantage | Trade-off / Added Complexity |
|-----------|------------------------------|
| Maximized Web Performance: Unbeatable LCP & zero JS overhead for static reading. | Dual Auth Overhead: Must manage HTTP-Only cookies for Web and Bearer Tokens for Mobile. |
| Mobile-Ready Architecture: REST API endpoints are ready for a native iOS/Android app. | Manual Endpoint Creation: Requires writing boilerplate `/api/*` handlers rather than purely relying on Server Actions. |
| Clear Separation of Concerns: Database code is strictly isolated in server services. | State Synchronization: After an API POST request (e.g., submitting a comment), the client must trigger a cache refresh (`router.refresh()`) to update RSCs. |

---

### 4. Responsibilities & Mapping Guide

| Folder / Layer | Role & Responsibility | What Lives Here | What NEVER Lives Here |
|----------------|----------------------|-----------------|----------------------|
| `src/app/` | Routing, page orchestration, REST handlers. | Page Server Components, route layouts, `generateMetadata`, API `route.ts`. | Heavy client state, direct Prisma queries, complex JSX views. |
| `src/components/ui/` | Domain-agnostic design system primitives. | Button, Input, Dialog, Tooltip (shadcn components). | Any domain types (Post, User), API fetch calls, business logic. |
| `src/components/layout/` | Global application frame. | Header, Footer, Main Navigation, Theme Toggle. | Specific blog post logic, comment forms. |
| `src/features/[domain]/` | Self-contained feature modules. | Domain UI components, custom hooks, server queries, validation schemas, feature types. | Global layout shells, other domain's private code. |
| `src/lib/` | Global infrastructure singletons & helpers. | Prisma singleton (`db.ts`), API response formatter (`api-response.ts`), `cn()` utility. | Feature-specific business rules. |

---

### 5. Code Standards & Convention Rules

#### File Naming

* Use `kebab-case` for all directories and non-special files (`post-card.tsx`, `auth-options.ts`).
* Use standard Next.js App Router filenames (`page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts`).

#### Exports & Import Paths

* Export named PascalCase functions from kebab-case files.
* Always use `@/*` path alias mapping to `./src/*`:

```typescript
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PostHeader } from "@/features/blog/components/post-header";
import { getPostBySlug } from "@/features/blog/server/post-service";
import { apiResponse } from "@/lib/api-response";
```

#### Standardized REST API Response Format

All REST endpoints inside `src/app/api/` return a standardized JSON structure via `src/lib/api-response.ts`:

```typescript
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

// Usage in API Routes
return apiResponse({ data: posts, status: 200 });
return apiResponse({ error: "Unauthorized access", status: 401 });
```

---

### 6. Database & Migration Strategy (Prisma)

#### Environment Management

Your database interactions rely on two separate connection strings to ensure safe pooling in serverless environments:

1. `DATABASE_URL`: Used exclusively by Prisma Client during runtime. This must be a pooled connection string (e.g., PgBouncer enabled).
2. `DIRECT_URL`: Used exclusively by the Prisma CLI for running migrations. This must be a direct, unpooled connection string.

```bash
# .env.local
DATABASE_URL="postgres://user:password@aws-region.pooler.neon.tech/neondb?pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgres://user:password@aws-region.pooler.neon.tech/neondb?connect_timeout=15"
```

#### Workflow Rules

* **Schema Changes:** Modify `prisma/schema.prisma`.
* **Local Migrations:** Run `npx prisma migrate dev --name <descriptive_name>`. This generates a SQL file in `prisma/migrations/`.
* **Production Deployments:** The CI/CD pipeline (e.g., Vercel build phase) must execute `npx prisma migrate deploy` to safely apply pending SQL migrations before building the Next.js artifacts.

---

### 7. Deployment & CI/CD Pipeline

#### Production Build Considerations

Deploying a hybrid app with full i18n support requires specific build-time checks:

* **TypeScript & Linting:** Run `next lint` and `tsc --noEmit` as pre-build checks to ensure strict type safety across the newly isolated `features/` folders.
* **Environment Variables:** Vercel (or your hosting provider) must contain all environment variables *before* build time, as Next.js statically analyzes and sometimes executes queries during the build phase to pre-render static pages.

#### Recommended CI/CD Steps (GitHub Actions to Vercel)

1. **Lint & Typecheck:** Fails the build immediately if rules in Section 5 are violated.
2. **Database Migration:** Executes `prisma migrate deploy` against the target environment DB using `DIRECT_URL`.
3. **Prisma Generate:** Creates the updated Prisma Client.
4. **Next.js Build:** Compiles RSCs, generates static HTML for known blog slugs, and bundles API routes.
5. **Deployment:** Pushes artifacts to the edge.

By isolating your domain logic (Section 4) and ensuring clear API boundaries (Section 3.3), your deployment pipeline remains resilient and perfectly staged for future integrations, including the mobile API layer.
