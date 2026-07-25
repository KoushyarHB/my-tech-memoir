# Phase 1: Infrastructure

> **Purpose:** Set up the foundational infrastructure for my-tech-memoir — Prisma schema with all models, database client singleton, API response helpers, and TypeScript configuration.
>
> **Prerequisites:** Node.js 18+, npm, Neon PostgreSQL database (or local PostgreSQL for development)
>
> **Estimated time:** 15–20 minutes

---

## Overview

This phase establishes the data layer and shared utilities that all subsequent phases depend on. You will:

1. Verify and complete the Prisma schema with all 10 models
2. Ensure the Prisma client singleton is correctly configured for Neon serverless
3. Create a reusable API response helper
4. Verify TypeScript path aliases work correctly
5. Ensure the postinstall script generates the Prisma client

---

## Step 1: Verify Project Dependencies

Run the following to confirm all required packages are installed:

```bash
cd /home/koushyar/my-tech-memoir
npm ls @prisma/client prisma @prisma/adapter-neon @neondatabase/serverless next react typescript
```

If any packages are missing, install them:

```bash
npm install @prisma/client@^7.8.0 prisma@^7.8.0 @prisma/adapter-neon@^7.9.0 @neondatabase/serverless@^1.1.0
npm install -D typescript@^5.8.3 @types/node @types/react @types/react-dom
```

---

## Step 2: Complete the Prisma Schema

Replace the contents of `prisma/schema.prisma` with the full schema below. This defines all 10 models with proper relations, indexes, and constraints.

**File:** `prisma/schema.prisma`

```prisma
// Prisma schema for my-tech-memoir
// https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ─── User ──────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  bio           String?
  role          UserRole  @default(USER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts        Account[]
  sessions        Session[]
  authoredPosts   PostAuthor[]
  comments        Comment[]
  bookmarks       Bookmark[]
  translations    Translation[]

  @@index([email])
}

enum UserRole {
  USER
  EDITOR
  ADMIN
}

// ─── NextAuth.js models ────────────────────────────────

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
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Post ──────────────────────────────────────────────

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

  @@index([published])
  @@index([publishedAt(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([slug])
}

// ─── PostAuthor (join table) ───────────────────────────

model PostAuthor {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  role      AuthorRole @default(AUTHOR)
  createdAt DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
}

enum AuthorRole {
  AUTHOR
  CO_AUTHOR
  EDITOR
}

// ─── Category ──────────────────────────────────────────

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts PostCategory[]

  @@index([slug])
}

// ─── Tag ───────────────────────────────────────────────

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts PostTag[]

  @@index([slug])
}

// ─── PostCategory (join table) ─────────────────────────

model PostCategory {
  id         String   @id @default(cuid())
  postId     String
  categoryId String
  createdAt  DateTime @default(now())

  post     Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([postId, categoryId])
  @@index([postId])
  @@index([categoryId])
}

// ─── PostTag (join table) ──────────────────────────────

model PostTag {
  id        String   @id @default(cuid())
  postId    String
  tagId     String
  createdAt DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([postId, tagId])
  @@index([postId])
  @@index([tagId])
}

// ─── Comment ───────────────────────────────────────────

model Comment {
  id         String        @id @default(cuid())
  postId     String
  userId     String?
  parentId   String?
  body       String
  authorName String?
  authorEmail String?
  status     CommentStatus @default(PENDING)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  post     Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  user     User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies  Comment[] @relation("CommentReplies")

  @@index([postId])
  @@index([userId])
  @@index([parentId])
  @@index([status])
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  SPAM
}

// ─── Bookmark ──────────────────────────────────────────

model Bookmark {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
}

// ─── Translation ───────────────────────────────────────

model Translation {
  id          String   @id @default(cuid())
  postId      String
  userId      String
  locale      String
  title       String
  excerpt     String?
  content     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, locale])
  @@index([postId])
  @@index([locale])
  @@index([userId])
}
```

### Schema Summary

| Model | Purpose | Key Relations |
|-------|---------|---------------|
| `User` | Authentication & profiles | → Accounts, Sessions, Posts (via PostAuthor), Comments, Bookmarks, Translations |
| `Account` | OAuth provider accounts (NextAuth) | → User |
| `Session` | Active user sessions (NextAuth) | → User |
| `VerificationToken` | Email verification (NextAuth) | — |
| `Post` | Blog articles | → Authors (PostAuthor), Categories, Tags, Comments, Bookmarks, Translations |
| `PostAuthor` | Post ↔ User join (multi-author) | → Post, User |
| `Category` | Content categories | → Posts (via PostCategory) |
| `Tag` | Content tags | → Posts (via PostTag) |
| `PostCategory` | Post ↔ Category join | → Post, Category |
| `PostTag` | Post ↔ Tag join | → Post, Tag |
| `Comment` | Threaded comments | → Post, User (optional), Parent/Replies (self-referential) |
| `Bookmark` | User bookmarks | → Post, User |
| `Translation` | Localized post content | → Post, User |

---

## Step 3: Verify Prisma Client Singleton

The file `src/lib/db.ts` should already exist with the Neon adapter. Verify it matches this pattern:

**File:** `src/lib/db.ts`

```typescript
/**
 * Prisma client singleton for Next.js.
 *
 * In development, Next.js hot-reloads modules on every request.
 * Without a singleton, a new PrismaClient is created per reload,
 * eventually exhausting database connections.
 *
 * This pattern stores the client on `globalThis` so it persists
 * across hot-reloads in dev, and is a no-op in production.
 */

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Important notes:**
- The import path `../../generated/prisma/client` is relative to `src/lib/` → `generated/prisma/client`
- This uses `@prisma/adapter-neon` for serverless Neon connections
- The singleton pattern prevents connection exhaustion during hot-reload
- `db` is the named export used throughout the app

---

## Step 4: Create API Response Helper

Create a reusable helper for consistent API route responses.

**File:** `src/lib/api-response.ts`

```typescript
/**
 * Standardized API response helpers.
 *
 * Usage:
 *   import { apiSuccess, apiError, apiPaginated } from "@/lib/api-response";
 *
 *   // In a route handler:
 *   return apiSuccess(data, { status: 200 });
 *   return apiError("Not found", { status: 404 });
 *   return apiPaginated(items, total, page, limit);
 */

import { NextResponse } from "next/server";

interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: ApiResponseMeta;
}

interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Success response with data.
 */
export function apiSuccess<T>(
  data: T,
  options?: ResponseOptions
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    {
      status: options?.status ?? 200,
      headers: options?.headers,
    }
  );
}

/**
 * Error response with message.
 */
export function apiError(
  error: string,
  options?: ResponseOptions
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, error },
    {
      status: options?.status ?? 500,
      headers: options?.headers,
    }
  );
}

/**
 * Paginated success response.
 */
export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  options?: ResponseOptions
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      status: options?.status ?? 200,
      headers: options?.headers,
    }
  );
}
```

---

## Step 5: Verify TypeScript Path Aliases

The `tsconfig.json` should already have the `@/*` alias. Verify:

**File:** `tsconfig.json` (relevant section)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This allows imports like:
```typescript
import { db } from "@/lib/db";
import { apiSuccess } from "@/lib/api-response";
```

No changes needed — this is already configured.

---

## Step 6: Verify Postinstall Script

The `package.json` should have the postinstall script to auto-generate the Prisma client:

**File:** `package.json` (relevant section)

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This is already configured. It runs automatically after `npm install`.

---

## Step 7: Run Prisma Generate

Generate the Prisma client from the schema:

```bash
cd /home/koushyar/my-tech-memoir
npx prisma generate
```

Expected output:
```
✔ Generated Prisma Client (v7.x.x) to ./generated/prisma in 123ms
```

---

## Step 8: Verify Schema with Prisma Format

Format the schema for consistency:

```bash
npx prisma format
```

Expected output:
```
Schema formatted from 180 to 180 lines
```

---

## Step 9: Validate Schema (Optional — requires database)

If you have a `.env` with a valid `DATABASE_URL`, you can validate the schema against the database:

```bash
npx prisma validate
```

Expected output:
```
✔ Valid schema
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] `npx prisma generate` succeeds without errors
- [ ] `generated/prisma/` directory exists with client files
- [ ] `src/lib/db.ts` exports `db` and uses the Neon adapter
- [ ] `src/lib/api-response.ts` exports `apiSuccess`, `apiError`, `apiPaginated`
- [ ] `tsconfig.json` has `"@/*": ["./src/*"]` in paths
- [ ] `package.json` has `"postinstall": "prisma generate"`

---

## Common Issues

### Issue: `generated/prisma/client` not found
**Solution:** Run `npx prisma generate` to create the client files.

### Issue: `DATABASE_URL` is undefined
**Solution:** Copy `.env.example` to `.env` and fill in your Neon connection string:
```bash
cp .env.example .env
# Edit .env with your actual DATABASE_URL
```

### Issue: Prisma Neuron adapter import error
**Solution:** Ensure `@prisma/adapter-neon` and `@neondatabase/serverless` are installed:
```bash
npm install @prisma/adapter-neon @neondatabase/serverless
```

### Issue: TypeScript cannot resolve `@/*` imports
**Solution:** Ensure `tsconfig.json` has `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }`.

---

## Next Phase

Once infrastructure is verified, proceed to **Phase 2: Authentication** — setting up NextAuth.js with providers, session management, and protected routes.

---

*This prompt is part of the my-tech-memoir implementation series.*
