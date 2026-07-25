# Design Prompt for Stitch — my-tech-memoir

## Overview
Design a personal developer portfolio and blog called "my-tech-memoir" for a developer named Koushyar.

### Brand Identity
- Style: Elegant & professional — balanced, trustworthy, enterprise feel
- Theme: Light mode primary, with full dark mode support
- Think: Linear, Vercel, or Stripe's blog aesthetic

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | #FFFFFF | Page background |
| Foreground | #1A1A2E | Primary text |
| Muted | #F5F5F7 | Subtle backgrounds, cards |
| Muted Foreground | #6B7280 | Secondary text |
| Primary | #1E40AF | Links, buttons, accents |
| Primary Foreground | #FFFFFF | Text on primary |
| Border | #E5E7EB | Dividers, card borders |
| Focus Ring | #93C5FD | Focus states |

---

## Dark Mode Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | #0F172A | Page background |
| Foreground | #F8FAFC | Primary text |
| Muted | #1E293B | Subtle backgrounds, cards |
| Muted Foreground | #94A3B8 | Secondary text |
| Primary | #60A5FA | Links, buttons, accents |
| Primary Foreground | #0F172A | Text on primary |
| Border | #334155 | Dividers, card borders |
| Focus Ring | #3B82F6 | Focus states |

---

## Typography

- Font: Inter (Google Fonts)
- H1: 36px, weight 700, line-height 1.2
- H2: 30px, weight 600, line-height 1.3
- H3: 24px, weight 600, line-height 1.4
- Body: 16px, weight 400, line-height 1.6
- Small: 14px, weight 400, line-height 1.5

---

## Spacing System

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

---

## Border Radius

| Token | Value |
|-------|-------|
| sm | 4px |
| md | 8px |
| lg | 12px |
| full | 9999px |

---

## Max Widths

| Element | Width |
|---------|-------|
| Content (blog posts) | 720px |
| Wide layout (projects) | 1024px |
| Full width (homepage) | 1280px |

---

## Pages to Design

### 1. Homepage
- Clean header with logo/name on left, nav on right (Home, Blog, Projects, About)
- Hero section: brief intro text, not overly promotional
- Featured Projects section: 2-3 project cards in a grid
- Recent Blog Posts section: 3 latest posts with title, excerpt, date
- Simple footer with social links (GitHub, LinkedIn, Twitter)

### 2. Blog Post Page
- Article layout: 720px max width, centered
- Title (large), author avatar + name, publish date, reading time
- Cover image below title
- Clean markdown-rendered content with good typography
- Tags displayed below title
- Comments section at bottom (clean, minimal)
- Related posts sidebar or bottom section

### 3. Projects Page
- Grid layout of project cards (2 columns on desktop, 1 on mobile)
- Each card: project name, brief description, tech stack tags, thumbnail image
- Hover state: subtle elevation/shadow
- Optional: filter by tech stack or category

### 4. About Page
- Professional photo placeholder on left
- Bio text on right
- Skills/tech stack section
- Social links with icons
- Contact form or email link

### 5. Blog Index Page
- List of all posts with title, excerpt, date, tags
- Search/filter functionality
- Pagination or infinite scroll

---

## Design Constraints
- Responsive: mobile-first, looks great on all screen sizes
- Dark mode: full support with theme toggle in header
- Minimal: lots of whitespace, no clutter
- Professional: trustworthy, enterprise-grade aesthetic
- Accessible: good contrast, clear hierarchy
- Fast: no heavy animations, subtle transitions only

---

## What to Avoid
- Aggressive gradients
- Glassmorphism
- Emoji everywhere
- Generic SaaS card grids
- Rainbow palettes
- Overly decorative illustrations
- Centered everything (use left-aligned for content)

---

## Deliverables

Please provide:
1. Full homepage mockup (desktop + mobile)
2. Blog post page mockup
3. Projects page mockup
4. Color palette and typography reference
5. Component library (buttons, cards, inputs, navigation)
