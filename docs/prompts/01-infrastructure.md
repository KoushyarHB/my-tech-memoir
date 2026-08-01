# Phase 1: Infrastructure

> **Status:** ✅ COMPLETED
> **Prerequisites:** None
> **Goal:** Set up the data layer — Prisma schema, DB client, API helpers, environment configuration.

---

## Consumes

- `@prisma/client`, `prisma`, `@prisma/adapter-neon`, `@neondatabase/serverless` (installed)
- `next`, `react`, `typescript` (installed)

## Produces

### Files

| File | Status | Exports |
|------|--------|---------|
| `prisma/schema.prisma` | ✅ Complete | 10 models + 3 enums (see Contracts) |
| `src/lib/db.ts` | ✅ Complete | `db` — PrismaClient singleton with Neon adapter |
| `src/lib/api-response.ts` | ✅ Complete | `apiSuccess`, `apiError`, `apiPaginated` |
| `.env.example` | ✅ Complete | `DATABASE_URL`, `DIRECT_URL` |
| `prisma/migrations/` | ✅ Reset | Stale init migration deleted; fresh baseline pending `.env` |

### Models Created (10 + 3 enums)

`User`, `Account`, `Session`, `VerificationToken`, `Post`, `PostAuthor`, `Category`, `Tag`, `PostCategory`, `PostTag`, `Comment`, `Bookmark`, `Translation`

Enums: `UserRole`, `AuthorRole`, `CommentStatus`

## Does NOT Build

- ❌ Auth configuration (Phase 2)
- ❌ UI primitives (Phase 0 — runs before this chronologically, but was added after)
- ❌ Feature services (Phase 4+)
- ❌ Migrations (pending `.env` — user runs `npx prisma migrate dev --name init`)

## Contracts

### `db` — Prisma client singleton

```typescript
import { db } from "@/lib/db";

// All Prisma operations go through this singleton
await db.post.findMany({ ... });
await db.user.create({ ... });
```

- Located at `src/lib/db.ts`
- Uses `@prisma/adapter-neon` with `DATABASE_URL` from env
- Singleton pattern prevents connection exhaustion during dev hot-reload
- Client generated to `generated/prisma/` (gitignored)

### `apiSuccess` / `apiError` / `apiPaginated` — API response helpers

```typescript
import { apiSuccess, apiError, apiPaginated } from "@/lib/api-response";

// Success
return apiSuccess(data, { status: 201 });

// Error
return apiError("Not found", { status: 404 });

// Paginated
return apiPaginated(posts, total, page, limit);
```

**Response shape:**
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "message" }

// Paginated
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```

> **Note for later phases:** This is the canonical API helper. Phase 6's original prompt used a different signature (`apiResponse({data, error, status})`) — that was discarded in favor of this Phase 1 version. All API routes in Phase 4, 5, 6 use `apiSuccess` / `apiError`.

### Prisma Schema — Key Models

#### User

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?           // NextAuth standard field name
  bio           String?
  role          UserRole  @default(USER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  authoredPosts PostAuthor[]
  comments      Comment[]
  bookmarks     Bookmark[]
  translations  Translation[]
}

enum UserRole { USER  EDITOR  ADMIN }
```

> **Deviation from original prompt:** Uses `image` (not `avatarUrl`) to match `@auth/prisma-adapter` defaults. This avoids custom field mapping in Phase 2.

#### Post

```prisma
model Post {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  excerpt     String?
  content     String
  coverImage  String?
  readingTime Int?
  published   Boolean  @default(false)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  authors      PostAuthor[]
  categories   PostCategory[]
  tags         PostTag[]
  comments     Comment[]
  bookmarks    Bookmark[]
  translations Translation[]
}
```

> **Note for Phase 4:** Posts use explicit join tables (`PostTag`, not implicit m2m). The `Tag` relation on `Post` is `tags PostTag[]`, not `tags Tag[]`. Queries must go through the join table: `db.post.findMany({ include: { tags: { include: { tag: true } } } })`. Phase 4's service layer handles this mapping.

#### Comment (threaded)

```prisma
model Comment {
  id          String        @id @default(cuid())
  postId      String
  userId      String?
  parentId    String?       // ← enables threaded replies
  body        String
  authorName  String?
  authorEmail String?
  status      CommentStatus @default(PENDING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  post    Post      @relation(...)
  user    User?     @relation(...)
  parent  Comment?  @relation("CommentReplies", ...)
  replies Comment[] @relation("CommentReplies")
}

enum CommentStatus { PENDING  APPROVED  REJECTED  SPAM }
```

> **Deviation from Phase 5's original prompt:** Phase 5 expected flat comments (no `parentId`). Our schema supports threading — Phase 5's code will be adapted to use this richer schema. The field is `body`, not `content` (Phase 5's prompt used `content`).

#### Bookmark

```prisma
model Bookmark {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post Post @relation(...)
  user User @relation(...)

  @@unique([postId, userId])   // composite unique — one bookmark per user per post
}
```

> **Note for Phase 6:** The composite unique constraint `@@unique([postId, userId])` means the Prisma `findUnique` uses `{ where: { postId_userId: { postId, userId } } }`. The `toggleBookmark` service checks existence first, then creates or deletes.

### Environment Variables

```bash
# .env (copy from .env.example)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"   # Neon pooled connection
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"     # Neon direct (for migrations)
```

## What Was Actually Built (deviations from original prompt)

| Original prompt said | What we did | Why |
|---------------------|-------------|-----|
| `User.avatarUrl` | `User.image` | NextAuth Prisma adapter expects `image` by default |
| Keep existing migration | Deleted `prisma/migrations/` and reset | Old migration only had Post+Tag; schema was fully replaced |
| Implicit m2m for Post↔Tag | Explicit `PostTag` join table | Matches full schema design; enables metadata on join |
| Flat Comments (Phase 5) | Threaded Comments with `parentId` | Threading is a superset — Phase 5 adapts |

## Pending (user action required)

1. Create `.env` from `.env.example` with Neon connection strings
2. Run `npx prisma migrate dev --name init` — creates fresh baseline migration
3. This must be done before Phase 4 (blog feature queries the DB)

---

*Phase 1 complete. Next: [Phase 2 — Authentication](./02-authentication.md)*
