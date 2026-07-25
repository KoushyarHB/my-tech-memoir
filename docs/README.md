# my-tech-memoir — Project Documentation

> A personal developer portfolio and blog inspired by [lee.robinson](https://leerob.io) — handcrafted, not template-generated.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [SPEC.md](./SPEC.md) | Business requirements, user journeys, features, and scope |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, database schema, API contracts, design tokens |
| [CONVENTIONS.md](./CONVENTIONS.md) | Code style, folder layout, testing, styling rules |
| [TASKS.md](./TASKS.md) | Granular implementation checklist with dependencies |

## Implementation Prompts

Step-by-step prompts for building each phase of the project:

| Phase | Prompt | Description |
|-------|--------|-------------|
| 1 | [Infrastructure](./prompts/01-infrastructure.md) | Prisma schema, DB client, API helpers, path aliases |
| 2 | [Authentication](./prompts/02-authentication.md) | NextAuth.js, providers, session management |
| 3 | [Layout & Providers](./prompts/03-layout-providers.md) | Root layout, theme, header, footer, i18n |
| 4 | [Blog Feature](./prompts/04-blog.md) | Post CRUD, Tiptap editor, pages, API routes |
| 5 | [Comments](./prompts/05-comments.md) | Comment system (anonymous + authenticated) |
| 6 | [Bookmarks](./prompts/06-bookmarks.md) | Bookmark toggle, reading progress |
| 7 | [Home & About](./prompts/07-home-about.md) | Homepage, about page, SEO |
| 8 | [Polish](./prompts/08-polish.md) | Error handling, loading states, final touches |

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
# Edit .env with your database URL

# Generate Prisma client
npx prisma generate

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
| Auth | NextAuth.js (Auth.js) | latest |
| Editor | Tiptap | latest |
| i18n | next-intl | latest |
| Hosting | Vercel | — |

---

## Design Philosophy

> *"The site should feel like walking into someone's personal workshop: organized, thoughtful, and alive with curiosity."*

- **Personal** — This is Koushyar's space
- **Simple** — Every element earns its place
- **Tastefully complex** — Complexity is hidden, not removed
- **Alive** — It grows and evolves

---

*Created via Spec-Driven Development (SDD) interview process.*
