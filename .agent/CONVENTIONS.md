# CONVENTIONS.md — my-tech-memoir

## Code Style

### Linting & Formatting
- **Strict** — ESLint + Prettier enforced on pre-commit
- **Zero warnings** allowed — all warnings must be fixed before commit
- Run `npm run lint` before every commit
- Run `npm run format` to auto-fix formatting issues

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig.json)
- No `any` types — use proper type definitions
- Use interfaces for object shapes, types for unions/intersections
- Export named exports from feature modules

---

## Folder Layout

### Architecture: Feature-Based (Vertical Slices)

```
src/
├── app/              # App Router (pages + API routes)
├── components/       # Global UI (shadcn, layout, providers)
├── features/         # Domain modules (blog, auth, comments, bookmarks)
├── lib/              # Singletons, clients, utilities
├── i18n/             # next-intl config
└── types/            # Global TypeScript types
```

### Feature Module Structure

Each feature follows this pattern:
```
features/[domain]/
├── components/       # Domain-aware UI components
├── hooks/            # Feature-specific hooks
├── server/           # Shared server services (Prisma queries)
├── types/            # Feature TypeScript definitions
└── utils/            # Feature-specific helpers
```

### File Naming
- Use `kebab-case` for all directories and non-special files
- Use standard Next.js App Router filenames (`page.tsx`, `layout.tsx`, `route.ts`)
- Export named PascalCase functions from kebab-case files

### Import Paths
- Always use `@/*` path alias mapping to `./src/*`

```typescript
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PostHeader } from "@/features/blog/components/post-header";
```

---

## Testing Rules

### Approach: Pragmatic Testing
- Test important features (auth, bookmarks, comments)
- Skip trivial utilities and pure UI components
- Focus on:
  - Authentication flows
  - API route handlers
  - Database service functions
  - Critical user interactions

### Tools
- **Unit tests:** Vitest
- **E2E tests:** Playwright (for critical paths only)

### Test Location
- Unit tests: `__tests__/` folder next to the file being tested
- E2E tests: `e2e/` folder at project root

### Test Commands
```bash
npm run test          # Run unit tests
npm run test:e2e      # Run E2E tests
npm run test:coverage # Run with coverage report
```

---

## Styling Rules

### Approach: Tailwind + Global CSS for Design Tokens

### Tailwind CSS
- Use Tailwind utility classes for all styling
- No custom CSS except for design tokens and global styles
- Use `cn()` utility from `@/lib/utils` for conditional classes

### Design Tokens
- Define CSS variables in `globals.css`
- Use Tailwind's `theme.extend` for custom values
- Support both light and dark mode via CSS variables

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #0070f3;
  /* ... */
}

.dark {
  --background: #000000;
  --foreground: #ededed;
  /* ... */
}
```

### Component Styling
- Use shadcn/ui components as base primitives
- Extend with Tailwind classes for customization
- Keep styles co-located with components
- Avoid inline styles

### Responsive Design
- Mobile-first approach
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`)
- Test on multiple viewports

---

## Git Conventions

### Commit Messages
```
type: concise subject line

Optional body.
```

### Types
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code refactoring
- `docs:` — Documentation
- `chore:` — Maintenance
- `test:` — Adding tests

### Branch Naming
- `main` — Production branch
- `feat/[feature-name]` — Feature branches
- `fix/[bug-name]` — Bug fix branches

### Pre-commit Hooks
- ESLint + Prettier run automatically
- All warnings must be resolved
- TypeScript compilation must pass
