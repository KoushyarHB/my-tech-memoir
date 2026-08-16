# Folder Structure — my-tech-memoir

> Color-highlighted tree: open [folder-structure.html](./folder-structure.html) in a browser.
> Snapshot after the `docs/pre` and `docs/post` split.
> Generated and vendor folders (`node_modules/`, `.next/`, `.git/`) are omitted.
> `generated/prisma/` is listed even though it is gitignored — it is produced by `prisma generate`.

## Legend

Color tree: [folder-structure.html](./folder-structure.html)

**Frontend** (muted): anything a normal Next.js UI project would have — pages, components, i18n, theme, config, docs. If a file is neither clearly frontend nor backend, it is treated as frontend.

**Backend** (highlighted): files that exist because this app has a database, DB-backed auth, and HTTP APIs.

| Color | Category | Examples |
|-------|----------|----------|
| Blue | API | `src/app/api/**/route.ts` |
| Green | Database | Prisma schema, migrations, generated client, `src/lib/db.ts` |
| Purple | Server | `src/features/*/server`, `src/lib/api-response.ts` |
| Orange | Auth | `src/auth.ts`, `src/lib/auth-guard.ts` |
| Yellow | Script | `scripts/` |

## You write vs Prisma generates

| You write | Prisma generates |
|-----------|------------------|
| `prisma/schema.prisma` — models and datasource | `generated/prisma/**` — client from `prisma generate` |
| `prisma/seed.ts` — seed data | `prisma/migrations/**` — SQL from `prisma migrate` |
| `src/lib/db.ts` — app wrapper around the client | `prisma.config.ts` — created by `prisma init` |

Do not edit files under `generated/prisma/`. Change `schema.prisma`, then run `npx prisma migrate dev` and `npx prisma generate`.

```
my-tech-memoir/
├── .agent/                         # empty
├── .env.example                    # Environment variable template
├── .gitignore
├── README.md
├── components.json                 # shadcn/ui config
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.js
├── package.json
├── package-lock.json
├── postcss.config.js
├── prisma.config.ts                # prisma auto generated (prisma init)
├── test-openclaw.md
├── tsconfig.json
│
├── docs/
│   ├── pre/                        # Original project documentation
│   │   ├── README.md               # Docs index + quick start
│   │   ├── SPEC.md                 # Business requirements and scope
│   │   ├── ARCHITECTURE.md         # Tech stack, schema, API, design system
│   │   ├── CONVENTIONS.md          # Code style and folder conventions
│   │   ├── TASKS.md                # Implementation checklist
│   │   └── prompts/                # Contract-driven phase prompts
│   │       ├── 00-design-system.md
│   │       ├── 01-infrastructure.md
│   │       ├── 02-authentication.md
│   │       ├── 03-layout-providers.md
│   │       ├── 04-blog.md
│   │       ├── 05-comments.md
│   │       ├── 06-bookmarks.md
│   │       ├── 07-home-about.md
│   │       ├── 08-polish.md
│   │       └── 09-admin-editor.md
│   └── post/                       # Later / derived documentation
│       └── folder-structure.md     # This file
│
├── generated/
│   └── prisma/                     # prisma auto generated (`prisma generate`)
│       ├── browser.ts
│       ├── client.ts
│       ├── commonInputTypes.ts
│       ├── enums.ts
│       ├── models.ts
│       ├── internal/
│       │   ├── class.ts
│       │   ├── prismaNamespace.ts
│       │   └── prismaNamespaceBrowser.ts
│       └── models/
│           ├── Account.ts
│           ├── Bookmark.ts
│           ├── Category.ts
│           ├── Comment.ts
│           ├── Post.ts
│           ├── PostAuthor.ts
│           ├── PostCategory.ts
│           ├── PostTag.ts
│           ├── PostView.ts
│           ├── Session.ts
│           ├── Tag.ts
│           ├── Translation.ts
│           ├── User.ts
│           └── VerificationToken.ts
│
├── messages/                       # next-intl locale catalogs
│   ├── en.json
│   └── fa.json
│
├── prisma/
│   ├── schema.prisma               # you write this
│   ├── seed.ts                     # you write this
│   └── migrations/                 # prisma auto generated (`prisma migrate`)
│       ├── migration_lock.toml
│       ├── 20260801184103_init/
│       │   └── migration.sql
│       ├── 20260802110000_add_post_views/
│       │   └── migration.sql
│       └── 20260811120000_add_tiptap_document/
│           └── migration.sql
│
├── public/
│   ├── preview.png
│   └── preview-top.png
│
├── scripts/                        # One-off maintenance scripts
│   ├── backfill-content-json.ts
│   ├── check-db.ts
│   ├── create-tags.ts
│   ├── fix-post-content.ts
│   ├── list-tags.ts
│   ├── promote-admin.ts
│   └── test-post.json
│
└── src/
    ├── auth.ts                     # Auth.js v5 config (handlers used by the auth route)
    ├── proxy.ts                    # next-intl + session middleware (frontend)
    │
    ├── app/                        # Next.js App Router
    │   ├── globals.css
    │   ├── layout.tsx              # Root layout
    │   ├── global-error.tsx
    │   │
    │   ├── [locale]/               # Public i18n routes
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   ├── not-found.tsx
    │   │   ├── (auth)/
    │   │   │   └── signin/
    │   │   │       └── page.tsx
    │   │   └── (main)/
    │   │       ├── page.tsx        # Home
    │   │       ├── error.tsx
    │   │       ├── about/
    │   │       │   └── page.tsx
    │   │       ├── bookmarks/
    │   │       │   └── page.tsx
    │   │       └── blog/
    │   │           ├── page.tsx
    │   │           ├── loading.tsx
    │   │           ├── [slug]/
    │   │           │   ├── page.tsx
    │   │           │   └── loading.tsx
    │   │           └── tag/
    │   │               └── [slug]/
    │   │                   └── page.tsx
    │   │
    │   ├── admin/                  # Admin dashboard (no locale prefix)
    │   │   ├── layout.tsx
    │   │   ├── page.tsx            # Dashboard
    │   │   ├── post-delete-button.tsx
    │   │   ├── [id]/
    │   │   │   └── page.tsx        # Edit post
    │   │   ├── new/
    │   │   │   └── page.tsx
    │   │   ├── posts/
    │   │   │   └── page.tsx
    │   │   ├── comments/
    │   │   │   └── page.tsx
    │   │   ├── tags/
    │   │   │   └── page.tsx
    │   │   ├── users/
    │   │   │   └── page.tsx
    │   │   ├── media/
    │   │   │   └── page.tsx
    │   │   ├── pages/
    │   │   │   └── page.tsx
    │   │   ├── appearance/
    │   │   │   └── page.tsx
    │   │   └── settings/
    │   │       └── page.tsx
    │   │
    │   └── api/                    # Next.js Route Handlers (HTTP backend)
    │       ├── auth/
    │       │   └── [...nextauth]/
    │       │       └── route.ts    ◀ BACKEND
    │       ├── bookmarks/
    │       │   └── route.ts        ◀ BACKEND
    │       ├── comments/
    │       │   └── route.ts        ◀ BACKEND
    │       ├── posts/
    │       │   ├── route.ts        ◀ BACKEND
    │       │   └── [id]/
    │       │       └── route.ts    ◀ BACKEND
    │       ├── tags/
    │       │   └── route.ts        ◀ BACKEND
    │       ├── upload/
    │       │   └── route.ts        ◀ BACKEND
    │       ├── users/
    │       │   ├── route.ts        ◀ BACKEND
    │       │   └── [id]/
    │       │       └── route.ts    ◀ BACKEND
    │       └── views/
    │           └── route.ts        ◀ BACKEND
    │
    ├── components/                 # Shared UI (not domain-specific)
    │   ├── data-table/
    │   │   ├── data-table.tsx
    │   │   ├── data-table-column-filter.tsx
    │   │   ├── data-table-column-header.tsx
    │   │   ├── index.ts
    │   │   └── types.ts
    │   ├── layout/
    │   │   ├── container.tsx
    │   │   ├── footer.tsx
    │   │   ├── header.tsx
    │   │   ├── language-switcher.tsx
    │   │   ├── page-header.tsx
    │   │   ├── section.tsx
    │   │   └── index.ts
    │   ├── providers/
    │   │   └── session-provider.tsx
    │   ├── theme/
    │   │   ├── ThemeProvider.tsx
    │   │   ├── ThemeScript.tsx
    │   │   ├── useTheme.ts
    │   │   └── index.ts
    │   └── ui/                     # shadcn/ui primitives
    │       ├── alert-dialog.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── skeleton.tsx
    │       ├── sonner.tsx
    │       ├── spinner.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       └── tooltip.tsx
    │
    ├── features/                   # Domain modules (vertical slices)
    │   ├── admin/
    │   │   ├── components/
    │   │   │   ├── admin-coming-soon.tsx
    │   │   │   ├── admin-comments-trend-chart.tsx
    │   │   │   ├── admin-post-growth-chart.tsx
    │   │   │   ├── admin-posts-table.tsx
    │   │   │   ├── admin-shell.tsx
    │   │   │   ├── admin-sidebar.tsx
    │   │   │   ├── admin-tags-manager.tsx
    │   │   │   ├── admin-topbar.tsx
    │   │   │   ├── admin-users-table.tsx
    │   │   │   ├── callout.ts
    │   │   │   ├── editor-toolbar.tsx
    │   │   │   ├── markdown.ts
    │   │   │   ├── memoir-image.ts
    │   │   │   ├── memoir-image-view.tsx
    │   │   │   ├── post-editor.tsx
    │   │   │   ├── post-editor-page.tsx
    │   │   │   ├── role-picker.tsx
    │   │   │   ├── slash-command.ts
    │   │   │   ├── upload-editor-image.ts
    │   │   │   └── index.ts
    │   │   ├── server/
    │   │   │   ├── dashboard-service.ts
    │   │   │   ├── tag-service.ts
    │   │   │   └── user-service.ts
    │   │   └── types/
    │   │       └── roles.ts
    │   ├── auth/
    │   │   ├── components/
    │   │   │   └── sign-in-buttons.tsx
    │   │   └── types/
    │   │       └── next-auth.d.ts
    │   ├── blog/
    │   │   ├── components/
    │   │   │   ├── lighthouse.tsx
    │   │   │   ├── post-card.tsx
    │   │   │   ├── post-date.tsx
    │   │   │   ├── post-header.tsx
    │   │   │   ├── post-tag.tsx
    │   │   │   ├── post-view-count.tsx
    │   │   │   ├── tiptap-content.tsx
    │   │   │   └── index.ts
    │   │   ├── lib/
    │   │   │   ├── html-to-document.ts
    │   │   │   ├── reading-time.ts
    │   │   │   ├── sanitize-post-html.ts
    │   │   │   └── slugify.ts
    │   │   ├── server/
    │   │   │   └── post-service.ts
    │   │   └── types/
    │   │       ├── document.ts
    │   │       └── index.ts
    │   ├── bookmarks/
    │   │   ├── components/
    │   │   │   ├── bookmark-button.tsx
    │   │   │   └── index.ts
    │   │   ├── server/
    │   │   │   └── bookmark-service.ts
    │   │   └── types/
    │   │       └── index.ts
    │   └── comments/
    │       ├── components/
    │       │   ├── comment-form.tsx
    │       │   ├── comment-list.tsx
    │       │   ├── comment-section.tsx
    │       │   └── index.ts
    │       ├── server/
    │       │   └── comment-service.ts
    │       └── types/
    │           └── index.ts
    │
    ├── i18n/                       # next-intl wiring
    │   ├── navigation.ts
    │   ├── request.ts
    │   └── routing.ts
    │
    └── lib/                        # Shared clients and helpers
        ├── api-response.ts
        ├── auth-guard.ts
        ├── db.ts
        ├── theme.ts
        └── utils.ts
```

The full color-coded tree is in [folder-structure.html](./folder-structure.html). `src/proxy.ts` is treated as frontend (a normal Next.js i18n app would have this middleware).

## Layout notes

| Area | Role |
|------|------|
| `src/app/` | Routes only — pages, layouts, and API handlers |
| `src/app/api/` | Next.js backend (Route Handlers) |
| `src/components/` | Shared UI: shadcn primitives, layout chrome, theme, data table |
| `src/features/` | Domain logic and domain UI, grouped by vertical slice |
| `src/lib/` | Singletons and cross-cutting helpers (`db`, auth guards, API wrappers) |
| `src/i18n/` | Locale routing and next-intl request config |
| `docs/pre/` | Original contract-driven docs and phase prompts |
| `docs/post/` | Documentation added after that baseline |
