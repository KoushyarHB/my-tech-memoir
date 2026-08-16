# my-tech-memoir — Project Documentation

> A personal developer portfolio and blog inspired by [lee.robinson](https://leerob.io) — handcrafted, not template-generated.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [SPEC.md](./SPEC.md) | Business requirements, user journeys, features, and scope |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, database schema, API contracts, design system |
| [CONVENTIONS.md](./CONVENTIONS.md) | Code style, folder layout, testing, styling rules |
| [TASKS.md](./TASKS.md) | Contract-Driven implementation checklist with status |

## Implementation Prompts (Contract-Driven)

Each prompt declares **Consumes**, **Produces**, **Does NOT Build**, and **Contracts** — making phases independently verifiable and preventing primitive reinvention.

| Phase | Status | Prompt | Description |
|-------|--------|--------|-------------|
| 0 | ✅ COMPLETED | [Design System](./prompts/00-design-system.md) | shadcn/ui primitives, layout helpers, token alias layer, icon system |
| 1 | ✅ COMPLETED | [Infrastructure](./prompts/01-infrastructure.md) | Prisma schema (10 models), DB client, API helpers |
| 2 | ✅ COMPLETED | [Authentication](./prompts/02-authentication.md) | Auth.js v5, GitHub + Google, sign-in page |
| 3 | ✅ COMPLETED | [Layout & i18n](./prompts/03-layout-providers.md) | next-intl, `[locale]` routing, language switcher, social footer |
| 4 | ✅ COMPLETED | [Blog](./prompts/04-blog.md) | Post service, components, pages, seed migration |
| 5 | ✅ COMPLETED | [Comments](./prompts/05-comments.md) | Threaded comments, anonymous + authenticated |
| 6 | ✅ COMPLETED | [Bookmarks](./prompts/06-bookmarks.md) | Toggle, listing page, API routes |
| 7 | ✅ COMPLETED | [Home & About](./prompts/07-home-about.md) | DB-driven homepage, about page |
| 8 | ✅ COMPLETED | [Polish](./prompts/08-polish.md) | ESLint, error boundaries, loading states, SEO |
| 9 | ⏳ PLANNED | [Admin & Editor](./prompts/09-admin-editor.md) | Tiptap WYSIWYG, auto-save, image upload, post management |

### Status Markers
- ✅ **COMPLETED** — Phase is built. Prompt documents what was actually built (retrospective).
- ⏳ **PLANNED** — Phase is not yet built. Prompt is executable with contracts.

---

## Contract-Driven Architecture

Every phase follows this structure:

```
## Consumes      ← What this phase needs from earlier phases (exact imports)
## Produces      ← What this phase creates (files, exports, routes)
## Does NOT Build ← Explicit anti-scope (prevents reinvention)
## Contracts     ← Component prop signatures, function signatures, type definitions
```

This ensures:
- No primitive reinvention across phases
- Types flow cleanly between phases
- Each phase is independently verifiable

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/KoushyarHB/my-tech-memoir.git
cd my-tech-memoir

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL + AUTH_SECRET + OAuth credentials

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Run development server
npm run dev
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| React | React | 19.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | 7.x |
| Database | Neon PostgreSQL | — |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui | latest |
| Auth | Auth.js v5 (NextAuth) | 5.x beta |
| i18n | next-intl | latest |
| Icons | lucide-react | latest |
| Hosting | Vercel | — |

---

## Design Philosophy

> *"The site should feel like walking into someone's personal workshop: organized, thoughtful, and alive with curiosity."*

- **Personal** — This is Koushyar's space
- **Simple** — Every element earns its place
- **Tastefully complex** — Complexity is hidden, not removed
- **Alive** — It grows and evolves

---

*Built via Contract-Driven Development — each phase declares its interfaces before implementation.*