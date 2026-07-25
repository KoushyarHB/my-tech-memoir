# SPEC.md — my-tech-memoir

## Business Goal

my-tech-memoir is Koushyar's personal developer blog — inspired by
lee.robinson (leerob.io) but with a deeper purpose.

The site should feel like walking into someone's personal workshop:
organized, thoughtful, and alive with curiosity. Every page should
feel handcrafted, not template-generated. The simplicity is intentional —
it shows care, not laziness.

### Core Principles
- **Personal** — This is Koushyar's space. It should feel like him.
- **Simple** — Clean, minimal, no clutter. Every element earns its place.
- **Tastefully complex** — Features exist because they serve a purpose,
  not because they're impressive. Complexity is hidden, not removed.
- **Alive** — The site grows and evolves. It's not a monument, it's a garden.

---

## Authors

Primary author: **Koushyar**. The platform supports a multi-author system
where team members and guest authors can contribute posts.

### Roles
- `PRIMARY` — Main author (Koushyar)
- `CONTRIBUTOR` — Guest writers who can publish posts

### Author Profiles
Each author has:
- Name, bio, avatar
- Social links (GitHub, Twitter, LinkedIn, website)
- Role (PRIMARY / CONTRIBUTOR)

---

## User Accounts

Signing in is **optional**. Readers can browse freely, but signing in
unlocks personalized features.

### Sign-in Methods
- Google OAuth
- Email + password
- Phone number (SMS verification)
- Magic link / passwordless

### Auth Provider
NextAuth.js (Auth.js) with multiple providers configured.

---

## Bookmarks & Reading Progress

### Bookmarks
- Simple bookmark icon on each post (toggle on/off)
- Saved posts appear in "My Bookmarks" page
- Available to signed-in users only

### Reading Progress
- Track how far user has scrolled in each post
- Show progress indicator (e.g., progress bar or percentage)
- Resume reading from where they left off
- Display "Continue Reading" on partially-read posts

---

## User Journeys

### Journey 1: New Reader
1. Arrives via shared blog post (social media, HN, Reddit)
2. Reads the article → finds it useful
3. Checks author profile → sees other posts
4. Signs in (optional) → bookmarks for later

### Journey 2: Recruiter / Hiring Manager
1. Arrives via link (resume, GitHub, referral)
2. Sees warm, personal homepage with Koushyar's intro
3. Reads recent blog posts → gets a sense of depth and curiosity
4. Clicks About Me → finds projects link, background, contact info
5. Reaches out

### Journey 3: Returning Reader
1. Signs in (optional)
2. Sees "Continue Reading" on partially-read posts
3. Checks "My Bookmarks" for saved articles
4. Discovers new posts from homepage

---

## Target Outcomes

The site succeeds when it achieves the following:

### Traffic & Engagement
- Consistent page views and unique visitors
- Average time on site > 2 minutes
- Blog posts rank for relevant keywords (SEO)

### Conversion & Outreach
- Contact form submissions from potential employers/clients
- Project inquiries
- Featured repos gain GitHub stars from site referral

### Content & Authority
- Regular publishing cadence (1+ posts/month)
- Guest authors contributing periodically
- Growing subscriber base

---

## Out of Scope (v1)

- **E-commerce** — No paid content, courses, memberships, or payments
  (planned for v2)
- **Mobile app** — Responsive web only, no native iOS/Android
  (planned for v2)
- **Real-time features** — No WebSocket, live notifications, or real-time collab

### Future Iterations (v2+)
- E-commerce / paid content
- Mobile app
- Newsletter system
- RSS feed
- Series/collections for multi-part posts
