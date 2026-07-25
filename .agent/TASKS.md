# TASKS.md — my-tech-memoir

## Task Granularity
Each task is **2-5 minutes** of focused work.

## Task Ordering
**Infrastructure first** — DB, auth, layout → then features.

## Dependencies
Each task lists what must be done first.

---

## Phase 1: Infrastructure

### Task 1.1: Prisma Schema Setup
**Objective:** Set up Prisma with all database models
**Dependencies:** None
**Files:** `prisma/schema.prisma`, `.env`, `.env.example`

**Steps:**
1. Configure `prisma/schema.prisma` with all models
2. Add `DATABASE_URL` and `DIRECT_URL` to `.env.example`
3. Run `npx prisma generate`
4. Run `npx prisma migrate dev --name init`

**Models to create:**
- User (managed by NextAuth)
- Post
- PostAuthor (junction)
- Category
- Tag
- PostCategory (junction)
- PostTag (junction)
- Comment
- Bookmark
- Translation

---

### Task 1.2: Prisma Client Singleton
**Objective:** Create reusable Prisma client
**Dependencies:** Task 1.1
**Files:** `src/lib/db.ts`

**Steps:**
1. Create `src/lib/db.ts` with Prisma singleton pattern
2. Handle hot-reload in development

---

### Task 1.3: API Response Helper
**Objective:** Create standardized API response utility
**Dependencies:** None
**Files:** `src/lib/api-response.ts`

**Steps:**
1. Create `ApiResponse<T>` type
2. Create `apiResponse()` helper function
3. Support success and error responses

---

### Task 1.4: Path Aliases
**Objective:** Configure TypeScript path aliases
**Dependencies:** None
**Files:** `tsconfig.json`

**Steps:**
1. Add `@/*` path alias mapping to `./src/*`
2. Verify imports work correctly

---

## Phase 2: Auth Setup

### Task 2.1: NextAuth Configuration
**Objective:** Set up NextAuth.js with all providers
**Dependencies:** Task 1.1, Task 1.2
**Files:** `src/features/auth/config/auth-options.ts`

**Steps:**
1. Install `next-auth` and `@next-auth/prisma-adapter`
2. Configure auth options with:
   - Google OAuth provider
   - Email provider (magic link)
   - Prisma adapter
3. Create auth options file

---

### Task 2.2: Auth API Route
**Objective:** Create NextAuth API route handler
**Dependencies:** Task 2.1
**Files:** `src/app/api/auth/[...nextauth]/route.ts`

**Steps:**
1. Create dynamic route handler
2. Import auth options
3. Export GET and POST handlers

---

### Task 2.3: Session Provider
**Objective:** Create session provider wrapper
**Dependencies:** Task 2.1
**Files:** `src/components/providers/session-provider.tsx`

**Steps:**
1. Create client component wrapper
2. Wrap children with SessionProvider
3. Export for use in layout

---

## Phase 3: Layout & Providers

### Task 3.1: Root Layout
**Objective:** Create root layout with providers
**Dependencies:** Task 2.3
**Files:** `src/app/layout.tsx`

**Steps:**
1. Import fonts (Inter)
2. Wrap with ThemeProvider
3. Wrap with SessionProvider
4. Add metadata

---

### Task 3.2: Theme Provider
**Objective:** Create dark/light mode provider
**Dependencies:** None
**Files:** `src/components/providers/theme-provider.tsx`

**Steps:**
1. Install `next-themes`
2. Create ThemeProvider wrapper
3. Export for use in layout

---

### Task 3.3: Theme Toggle
**Objective:** Create theme toggle component
**Dependencies:** Task 3.2
**Files:** `src/components/layout/theme-toggle.tsx`

**Steps:**
1. Create toggle button
2. Use `useTheme()` hook
3. Add sun/moon icons

---

### Task 3.4: Header Component
**Objective:** Create site header with navigation
**Dependencies:** Task 3.3
**Files:** `src/components/layout/header.tsx`

**Steps:**
1. Create header layout
2. Add logo/site name
3. Add navigation links (Home, Blog, About)
4. Add theme toggle
5. Add sign-in button

---

### Task 3.5: Footer Component
**Objective:** Create site footer
**Dependencies:** None
**Files:** `src/components/layout/footer.tsx`

**Steps:**
1. Create footer layout
2. Add social links (GitHub, LinkedIn, Twitter)
3. Add copyright text

---

### Task 3.6: i18n Setup
**Objective:** Configure next-intl for multilingual support
**Dependencies:** None
**Files:** `src/i18n/request.ts`, `src/i18n/routing.ts`, `messages/en.json`, `messages/fa.json`

**Steps:**
1. Install `next-intl`
2. Create i18n configuration files
3. Create translation JSON files
4. Configure middleware for locale routing

---

### Task 3.7: Middleware
**Objective:** Create middleware for auth + i18n
**Dependencies:** Task 2.1, Task 3.6
**Files:** `middleware.ts`

**Steps:**
1. Create middleware function
2. Add i18n locale detection
3. Add auth protection for protected routes
4. Configure matcher

---

## Phase 4: Blog Feature

### Task 4.1: Post Service
**Objective:** Create database service for posts
**Dependencies:** Task 1.2
**Files:** `src/features/blog/server/post-service.ts`

**Steps:**
1. Create `getPostBySlug()` function
2. Create `getPostById()` function
3. Create `getPosts()` function with pagination
4. Create `createPost()` function
5. Create `updatePost()` function
6. Create `deletePost()` function

---

### Task 4.2: Post Types
**Objective:** Define TypeScript types for posts
**Dependencies:** None
**Files:** `src/features/blog/types/index.ts`

**Steps:**
1. Create `Post` interface
2. Create `PostWithAuthor` interface
3. Create `PostWithTranslations` interface
4. Create `CreatePostInput` type
5. Create `UpdatePostInput` type

---

### Task 4.3: Reading Time Utility
**Objective:** Calculate reading time for posts
**Dependencies:** None
**Files:** `src/features/blog/utils/calculate-reading-time.ts`

**Steps:**
1. Create function to count words
2. Calculate reading time (avg 200 words/min)
3. Return formatted string

---

### Task 4.4: Post Card Component
**Objective:** Create reusable post card
**Dependencies:** Task 4.2
**Files:** `src/features/blog/components/post-card.tsx`

**Steps:**
1. Create card layout
2. Display title, excerpt, date, reading time
3. Add link to post detail
4. Style with Tailwind

---

### Task 4.5: Post Header Component
**Objective:** Create post header with metadata
**Dependencies:** Task 4.2
**Files:** `src/features/blog/components/post-header.tsx`

**Steps:**
1. Create header layout
2. Display title, author, date, reading time
3. Add tags
4. Add cover image

---

### Task 4.6: Blog List Page
**Objective:** Create blog listing page
**Dependencies:** Task 4.1, Task 4.4
**Files:** `src/app/[locale]/(main)/blog/page.tsx`

**Steps:**
1. Create page component (Server Component)
2. Fetch posts from database
3. Render PostCard for each post
4. Add pagination

---

### Task 4.7: Blog Post Page
**Objective:** Create individual post page
**Dependencies:** Task 4.1, Task 4.5
**Files:** `src/app/[locale]/(main)/blog/[slug]/page.tsx`

**Steps:**
1. Create page component (Server Component)
2. Fetch post by slug
3. Render PostHeader
4. Render markdown content
5. Add generateMetadata for SEO

---

### Task 4.8: Posts API Route
**Objective:** Create REST API for posts
**Dependencies:** Task 4.1
**Files:** `src/app/api/posts/route.ts`

**Steps:**
1. Create GET handler (list posts)
2. Create POST handler (create post)
3. Add authentication check
4. Add input validation

---

### Task 4.9: Post API Route
**Objective:** Create REST API for single post
**Dependencies:** Task 4.1
**Files:** `src/app/api/posts/[id]/route.ts`

**Steps:**
1. Create GET handler (get post)
2. Create PUT handler (update post)
3. Create DELETE handler (delete post)
4. Add authentication check

---

## Phase 5: Comments Feature

### Task 5.1: Comment Service
**Objective:** Create database service for comments
**Dependencies:** Task 1.2
**Files:** `src/features/comments/server/comment-service.ts`

**Steps:**
1. Create `getCommentsByPostId()` function
2. Create `createComment()` function
3. Create `deleteComment()` function
4. Add moderation status handling

---

### Task 5.2: Comment Types
**Objective:** Define TypeScript types for comments
**Dependencies:** None
**Files:** `src/features/comments/types/index.ts`

**Steps:**
1. Create `Comment` interface
2. Create `CommentWithAuthor` interface
3. Create `CreateCommentInput` type

---

### Task 5.3: Comment List Component
**Objective:** Display comments for a post
**Dependencies:** Task 5.2
**Files:** `src/features/comments/components/comment-list.tsx`

**Steps:**
1. Create list layout
2. Render each comment
3. Show author name/avatar
4. Show timestamp

---

### Task 5.4: Comment Form Component
**Objective:** Create comment submission form
**Dependencies:** Task 5.2
**Files:** `src/features/comments/components/comment-form.tsx`

**Steps:**
1. Create form with textarea
2. Handle anonymous vs authenticated
3. Add submit handler
4. Add loading state

---

### Task 5.5: Comments API Route
**Objective:** Create REST API for comments
**Dependencies:** Task 5.1
**Files:** `src/app/api/posts/[id]/comments/route.ts`

**Steps:**
1. Create GET handler (list comments)
2. Create POST handler (create comment)
3. Add input validation
4. Sanitize content

---

### Task 5.6: Integrate Comments in Post Page
**Objective:** Add comments section to blog post
**Dependencies:** Task 4.7, Task 5.3, Task 5.4
**Files:** `src/app/[locale]/(main)/blog/[slug]/page.tsx`

**Steps:**
1. Import CommentList and CommentForm
2. Add comments section below post content
3. Fetch comments for the post
4. Render components

---

## Phase 6: Bookmarks Feature

### Task 6.1: Bookmark Service
**Objective:** Create database service for bookmarks
**Dependencies:** Task 1.2
**Files:** `src/features/bookmarks/server/bookmark-service.ts`

**Steps:**
1. Create `getBookmarksByUserId()` function
2. Create `toggleBookmark()` function
3. Create `isBookmarked()` function

---

### Task 6.2: Bookmark Button Component
**Objective:** Create bookmark toggle button
**Dependencies:** Task 6.1
**Files:** `src/features/bookmarks/components/bookmark-button.tsx`

**Steps:**
1. Create button with heart/bookmark icon
2. Handle toggle state
3. Add loading state
4. Show filled/outline based on state

---

### Task 6.3: Bookmarks API Route
**Objective:** Create REST API for bookmarks
**Dependencies:** Task 6.1
**Files:** `src/app/api/bookmarks/route.ts`

**Steps:**
1. Create GET handler (list bookmarks)
2. Create POST handler (toggle bookmark)
3. Add authentication check

---

### Task 6.4: Bookmarks Page
**Objective:** Create bookmarks listing page
**Dependencies:** Task 6.1, Task 4.4
**Files:** `src/app/[locale]/(main)/bookmarks/page.tsx`

**Steps:**
1. Create page component
2. Fetch user's bookmarks
3. Render PostCard for each bookmarked post
4. Add empty state

---

### Task 6.5: Integrate Bookmark Button in Post
**Objective:** Add bookmark button to blog post
**Dependencies:** Task 4.7, Task 6.2
**Files:** `src/app/[locale]/(main)/blog/[slug]/page.tsx`

**Steps:**
1. Import BookmarkButton
2. Add to post header
3. Pass postId to component

---

## Phase 7: Home Page

### Task 7.1: Home Page
**Objective:** Create homepage with intro and recent posts
**Dependencies:** Task 4.1, Task 4.4
**Files:** `src/app/[locale]/(main)/page.tsx`

**Steps:**
1. Create page component (Server Component)
2. Add personal intro/greeting
3. Fetch recent posts
4. Render PostCard for each post
5. Add "View All Posts" link

---

## Phase 8: About Page

### Task 8.1: About Page
**Objective:** Create about page with author info
**Dependencies:** None
**Files:** `src/app/[locale]/(main)/about/page.tsx`

**Steps:**
1. Create page layout
2. Add author photo placeholder
3. Add bio text
4. Add skills/tech stack section
5. Add social links
6. Add contact form or email link

---

## Phase 9: Polish

### Task 9.1: SEO Metadata
**Objective:** Add metadata to all pages
**Dependencies:** All feature tasks
**Files:** Various `page.tsx` files

**Steps:**
1. Add `generateMetadata()` to each page
2. Add Open Graph images
3. Add canonical URLs
4. Add JSON-LD structured data

---

### Task 9.2: Error Handling
**Objective:** Add error boundaries and 404 page
**Dependencies:** None
**Files:** `src/app/not-found.tsx`, `src/app/error.tsx`

**Steps:**
1. Create custom 404 page
2. Create error boundary
3. Add loading states

---

### Task 9.3: Loading States
**Objective:** Add loading indicators
**Dependencies:** None
**Files:** Various `loading.tsx` files

**Steps:**
1. Create loading skeletons
2. Add loading.tsx for routes
3. Add Suspense boundaries

---

## Verification Checklist

After completing all tasks, verify:
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run build` succeeds
- [ ] All pages render correctly
- [ ] Auth flow works (sign in/sign out)
- [ ] Bookmarks toggle correctly
- [ ] Comments submit successfully
- [ ] Dark/light mode toggles
- [ ] i18n locale switching works
- [ ] Responsive on mobile/tablet/desktop
