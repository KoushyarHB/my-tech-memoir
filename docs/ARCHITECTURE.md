# ARCHITECTURE.md — my-tech-memoir

> Technical architecture, database schema, API contracts, and design system.

---

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
| Icons | lucide-react | latest |

### Content & Editing

| Purpose | Technology |
|---------|-----------|
| Rich text editor | Tiptap (WYSIWYG → HTML output) — *deferred* |
| Content storage | HTML stored in PostgreSQL |
| Image uploads | Vercel Blob or S3 — *deferred* |
| Multilingual | next-intl |
| Comments | Custom (anonymous + authenticated, threaded) |

### Auth & Hosting

| Purpose | Technology |
|---------|-----------|
| Authentication | Auth.js v5 (NextAuth) — GitHub, Google |
| Hosting | Vercel |
| Analytics | Vercel Analytics |

### Dev Tooling

| Purpose | Technology |
|---------|-----------|
| Package manager | npm |
| Linting | ESLint flat config (strict, zero warnings) |
| Testing | Vitest (unit) + Playwright (e2e) — *planned* |

---

## Design System

### Token Architecture (Two-Layer)

Our design tokens are the **source of truth**. shadcn/ui tokens are **aliases** that reference our tokens. Both coexist:

```
Our tokens (source of truth)        shadcn aliases (reference our tokens)
─────────────────────────────       ───────────────────────────────────
--bg-base: #fafafa          ←→     --background: var(--bg-base)
--bg-raised: #f4f4f4        ←→     --card: var(--bg-raised)
--ink-primary: #1a1a1a      ←→     --foreground: var(--ink-primary)
--accent: #2563eb           ←→     --primary: var(--accent)
--bg-muted: #e9e9e9         ←→     --secondary: var(--bg-muted)
                                ←→ --accent: var(--bg-muted) [shadcn's accent ≠ ours]
```

> **Warning:** shadcn's `--accent` token has a different meaning than our `--accent`. shadcn's `accent` = subtle hover background. Our `accent` = brand blue. The alias layer maps them correctly. Components using `bg-primary` get our blue. Components using `bg-accent` (shadcn) get muted background.

### Primitives (Phase 0)

| Component | Location | Used By |
|-----------|----------|---------|
| `<Button>` | `src/components/ui/button.tsx` | Auth (2), Comments (5), Bookmarks (6), About (7) |
| `<Card>` | `src/components/ui/card.tsx` | Blog cards (4), Comments (5), About (7) |
| `<Badge>` | `src/components/ui/badge.tsx` | Tags (4), Skills (7) |
| `<Input>` | `src/components/ui/input.tsx` | Comments (5) |
| `<Textarea>` | `src/components/ui/textarea.tsx` | Comments (5) |
| `<Label>` | `src/components/ui/label.tsx` | Comments (5) |
| `<Avatar>` | `src/components/ui/avatar.tsx` | Header (2), Comments (5) |
| `<Skeleton>` | `src/components/ui/skeleton.tsx` | Loading states (8) |
| `<Separator>` | `src/components/ui/separator.tsx` | Dividers |
| `<Spinner>` | `src/components/ui/spinner.tsx` | Loading states (8) |

### Layout Helpers

| Component | Location | Purpose |
|-----------|----------|---------|
| `<Container size>` | `src/components/layout/container.tsx` | Max-width wrapper (sm/md/lg) |
| `<Section>` | `src/components/layout/section.tsx` | Semantic `<section>` wrapper |
| `<PageHeader>` | `src/components/layout/page-header.tsx` | Title + optional description |

### Icon System

All icons come from `lucide-react`. No inline SVGs except for brand icons not in lucide (Google logo).

```typescript
import { Sun, Moon, Github, Bookmark, ArrowRight } from "lucide-react";
```

---

## Database Schema

### ER Diagram

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

## Directory Structure

```
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
│   └── schema.prisma
│
├── messages/                       # i18n translation JSONs
│   ├── en.json
│   └── fa.json
│
├── public/
│   └── images/
│
└── src/
    ├── app/                        # App Router
    │   ├── [locale]/
    │   │   ├── (main)/
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx        # Home
    │   │   │   ├── blog/
    │   │   │   ├── authors/
    │   │   │   └── bookmarks/
    │   │   └── (auth)/
    │   │       ├── signin/
    │   │       └── error/
    │   ├── api/
    │   │   ├── auth/
    │   │   ├── posts/
    │   │   └── bookmarks/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── not-found.tsx
    │
    ├── components/
    │   ├── ui/                     # shadcn primitives
    │   ├── layout/                 # Header, Footer, ThemeToggle
    │   └── providers/              # Theme, Session, i18n
    │
    ├── features/
    │   ├── blog/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── server/
    │   │   ├── types/
    │   │   └── utils/
    │   ├── comments/
    │   ├── bookmarks/
    │   └── auth/
    │
    ├── lib/                        # db.ts, api-response.ts, utils.ts
    ├── i18n/                       # next-intl config
    └── types/                      # Global TypeScript types
```

---

## Architectural Principles

### Hybrid Data Fetching

1. **Server-Rendered Content (RSCs):** Blog posts, author pages, public feeds run as React Server Components with zero client-side JS.

2. **REST API Mutations:** Interactive features (comments, bookmarks, auth) execute via API routes under `src/app/api/*`.

### Core Principles

- **Locality of Behavior:** Code that changes together lives together in `src/features/[feature]`.
- **Thin Routes:** `page.tsx` files are conductors — they assemble components, not hold logic.
- **Shared Services:** `src/features/*/server/` modules are reused by both RSC and API routes.
- **Primitive Isolation:** shadcn components in `src/components/ui/` are domain-agnostic.

### Boundary Rules

1. `page.tsx` and `route.ts` MAY call `features/*/server/*` directly.
2. RSCs must NEVER fetch their own API routes — import services directly.
3. Client components must NEVER import from `features/*/server/*` — use `/api/*`.

---

*Full architecture blueprint: see `folder-structure.md` in `.agent/` folder.*
