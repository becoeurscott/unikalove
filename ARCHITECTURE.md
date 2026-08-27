# UnikaLove — Technical Architecture

> Companion docs: [PRD.md](PRD.md) · [ARCHITECTURE-ESSENTIALS.md](ARCHITECTURE-ESSENTIALS.md) (quick reference) · [AGENTS.md](AGENTS.md)

---

## 1. Overview

Monorepo (npm workspaces) with a **NestJS modular-monolith API** as the single backend, three Next.js frontends (admin, user web app, landing), and a shared package for types/constants. Built backend-first; every frontend consumes the same versioned REST + WebSocket API, which keeps the platform mobile-ready.

```
unique/
├── apps/
│   ├── api/        NestJS backend (REST + WebSocket)  ← Phase 1
│   ├── admin/      Next.js admin dashboard            ← Phase 2
│   ├── web/        Next.js user app                   ← Phase 3
│   └── landing/    Next.js animated landing page      ← Phase 4
├── packages/
│   └── shared/     TypeScript types, enums, constants shared API ↔ frontends
├── assets/         brand notes + videos (header-bg.mp4, loop.mp4)
└── docs/           design-references.md (visual spec from mockups)
```

## 2. Backend (`apps/api`) — NestJS

**Stack:** Node.js 20+, NestJS 10, Prisma ORM, PostgreSQL 16 (+ PostGIS), Redis 7 (cache/sessions/presence + BullMQ queues), Socket.IO, S3-compatible object storage (Cloudflare R2 or AWS S3), class-validator, Passport.

### 2.1 Modules

| Module | Responsibility |
|---|---|
| `auth` | Email/password, OAuth (Google/Facebook/Apple), JWT access (15min) + rotating refresh tokens (httpOnly cookie), email verification, password reset, account recovery, admin 2FA (TOTP) |
| `users` | Account lifecycle, roles (USER/MODERATOR/ADMIN/SUPER_ADMIN), suspension/ban, device/session management |
| `profiles` | Profile CRUD, photos (order, moderation status), interests, preferences, completeness score, verification requests |
| `discovery` | Candidate feed: filters + PostGIS distance + exclusions (blocked/swiped) + AI ranking; Daily Picks job |
| `matching` | Swipes (pass/like/superlike/favorite), mutual-match creation, match expiry, "who liked you" |
| `messaging` | Socket.IO gateway + REST history: conversations, messages, typing, read receipts, reactions, GIF/photo messages |
| `calls` | WebRTC signaling over Socket.IO (TURN via managed service); privacy controls |
| `ai` | Claude API integration: compatibility scoring features, profile suggestions, conversation starters/replies, coach assistant, date planning. All AI calls behind an `AiService` interface with per-feature prompt templates and rate budgets |
| `safety` | Reports, blocks, moderation queue, AI content moderation pipeline (text + image on upload/send), scam/fake risk scoring |
| `payments` | **`PaymentProvider` interface** — `StripeProvider` (Phase 5), `FlutterwaveProvider` (later). Webhooks, transactions, refunds, coupons, credits ledger, referrals. No provider-specific logic outside adapters |
| `subscriptions` | Plans (FREE/PREMIUM/PREMIUM_PLUS), entitlement checks (guard + decorator), grace periods |
| `notifications` | In-app + push (FCM/web-push) + email (Resend/SES); templates, user channel preferences, digest jobs |
| `events` | Events & interest communities (Phase 5+) |
| `admin` | Admin REST namespace: KPI aggregates, user management, moderation actions, content management, broadcast, settings; every mutation writes `AdminAuditLog` |
| `analytics` | Event ingestion (BullMQ), rollup tables for dashboard charts (user growth, matches overview, gender distribution, revenue) |
| `media` | Signed upload URLs, image processing (thumbnails, EXIF strip), storage lifecycle |

### 2.2 Data model (core entities)

`User` (auth, role, status) → `Profile` (bio, gender, birthdate, location `geography(Point)`, completeness) → `Photo[]`, `Interest[]` (m2m), `Preference` (age range, distance, genders, intent) · `Swipe` (actor, target, type) · `Match` (userA, userB, matchedAt, status) → `Conversation` → `Message` (type: text/gif/photo, readAt, reactions) · `Subscription` (plan, provider, period, status) · `Payment` / `CreditLedger` / `Coupon` / `Referral` · `Report`, `Block`, `ModerationCase`, `VerificationRequest` · `Notification` · `Event`, `Community` · `AdminAuditLog` · `AnalyticsEvent` + rollups.

Conventions: UUID PKs, `createdAt/updatedAt` on all tables, soft delete (`deletedAt`) for user content, Prisma migrations committed to repo.

### 2.3 Cross-cutting

- **API shape:** REST under `/api/v1`, OpenAPI (Swagger) auto-generated; cursor pagination; standard error envelope
- **Realtime:** one Socket.IO namespace `/rt` with rooms per user + per conversation; presence in Redis; events also fan out to notifications
- **Security:** helmet, CORS allowlist, global rate limiting (tighter on auth), input validation via DTO + class-validator, output serialization (no leaking emails/exact location), field-level encryption for sensitive PII, secrets via env only
- **Geo:** PostGIS `ST_DWithin` for radius queries; store precise point, expose city-level only
- **Jobs (BullMQ):** daily-picks generation, moderation pipeline, notification digests, analytics rollups, subscription renewals/webhook retries
- **Observability:** pino structured logs, request IDs, health endpoints `/health`, metrics-ready (Prometheus format)

## 3. Frontends

Common: Next.js 15 (App Router), TypeScript, Tailwind CSS, TanStack Query, shared design tokens from `docs/design-references.md`, i18n (French default, English) via `next-intl`.

### 3.1 `apps/admin` — Admin Dashboard (Phase 2)
Reproduces the admin mockup: sidebar (Dashboard, Users, Matches, Conversations, Payments, Reports, Content Management, App Settings, Notifications, Support, Logout), KPI cards with week-over-week deltas, user-growth line chart, matches-overview donut, gender-distribution donut, top active users, recent-activity feed. Charts: Recharts. Auth: admin login + 2FA, role-gated routes. Talks only to `/api/v1/admin/*`.

### 3.2 `apps/web` — User App (Phase 3)
DateLuxe-style layout: sidebar (Dashboard, Discover, Likes, Matches, Messages, Bookmarks, Profile, Settings) with badge counts; discover cards (✕ ★ ♥), Daily Picks row, profile-completeness ring, "Who Liked You", matches list, premium upsell panel, boost banner, safety-tips card. Realtime via Socket.IO client.

### 3.3 `apps/landing` — Landing Page (Phase 4)
Framer-style experience rebuilt in Next.js + **Framer Motion** (+ Lenis smooth scroll):
- **Hero:** full-bleed autoplaying muted looped `assets/video/header-bg.mp4` background with gradient overlay, brand logo, headline "L'amour n'a pas de frontières", signup CTA card (email / Google / Facebook / Apple)
- Scroll-triggered section reveals, parallax photo collage (angled photo shards like the identity image), feature icons row (Profils vérifiés, Sécurité & Confidentialité, Match intelligents, Ouvert à tous), pricing section, footer
- `assets/video/loop.mp4` available as a secondary section loop
- Performance: poster frame + lazy video, `prefers-reduced-motion` respected

## 4. Environments & Deployment

- **Local:** docker-compose (postgres+postgis, redis, minio) + `npm run dev` per app
- **Staging/Prod:** API on Railway/Fly.io/Render (Dockerfile), frontends on Vercel, managed Postgres (Neon/Supabase-db/RDS) + Redis (Upstash), R2/S3 media, CDN in front of media
- **Config:** `.env` per app, `.env.example` committed, secrets never in code
- CI later: lint + typecheck + test + prisma migrate diff on PR

## 5. Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Backend style | Modular monolith | Small team speed; module boundaries allow later extraction |
| ORM | Prisma | Type-safe, migration workflow, fast iteration |
| Payments | Provider interface, Stripe first | User decision; Flutterwave (Mobile Money) added without touching business logic |
| AI | Claude API behind `AiService` | Matching, coach, moderation; swappable, budget-controlled |
| Realtime | Socket.IO | Rooms, fallbacks, mature Nest integration |
| Search/geo | Postgres + PostGIS first | Avoid extra infra until scale demands (Elastic/Typesense later) |
