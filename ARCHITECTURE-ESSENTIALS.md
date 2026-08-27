# UnikaLove — Architecture Essentials (Quick Reference)

> Condensed from [ARCHITECTURE.md](ARCHITECTURE.md). Load this during coding sessions.

## Stack

| Layer | Tech |
|---|---|
| API | NestJS 10 (modular monolith), REST `/api/v1` + Socket.IO `/rt`, Swagger |
| DB | PostgreSQL 16 + PostGIS, Prisma ORM (migrations committed) |
| Cache/Queues | Redis 7 — cache, sessions, presence, BullMQ jobs |
| Storage | S3-compatible (R2/S3), signed uploads, thumbnails, EXIF strip |
| AI | Claude API behind `AiService` interface (matching, coach, moderation) |
| Payments | `PaymentProvider` interface — **Stripe first**, Flutterwave later |
| Frontends | Next.js 15 + Tailwind + TanStack Query + next-intl (FR default, EN) |
| Landing anims | Framer Motion + Lenis; hero video `assets/video/header-bg.mp4` |

## Monorepo

```
apps/api      NestJS backend        ← Phase 1 (build first)
apps/admin    Admin dashboard       ← Phase 2
apps/web      User app (DateLuxe)   ← Phase 3
apps/landing  Animated landing      ← Phase 4
packages/shared  shared TS types/enums/constants
assets/       videos + brand · docs/design-references.md = visual spec
```

## API modules (one-liners)

`auth` JWT+refresh rotation, OAuth G/FB/Apple, admin 2FA · `users` roles/status/sessions · `profiles` photos, interests, prefs, verification, completeness · `discovery` filtered+PostGIS+AI-ranked feed, Daily Picks · `matching` swipes → mutual matches, who-liked-you · `messaging` Socket.IO chat: typing, receipts, reactions, GIF/photo · `calls` WebRTC signaling · `ai` Claude features · `safety` reports, blocks, AI moderation, scam scoring · `payments` provider adapters, credits, coupons, referrals, webhooks · `subscriptions` FREE/PREMIUM/PREMIUM_PLUS entitlement guard · `notifications` push/email/in-app · `events` communities (later) · `admin` KPI + management + `AdminAuditLog` on every mutation · `analytics` event ingest + rollups · `media` uploads.

## Core entities

User → Profile (geo point, completeness) → Photos/Interests/Preference · Swipe · Match → Conversation → Message · Subscription · Payment/CreditLedger/Coupon/Referral · Report/Block/ModerationCase/VerificationRequest · Notification · AdminAuditLog · AnalyticsEvent.
Conventions: UUID PKs, createdAt/updatedAt everywhere, soft delete for user content.

## Hard rules

1. Backend first — frontends only consume the versioned API (mobile-ready).
2. Payment logic ONLY inside `PaymentProvider` adapters.
3. All AI calls through `AiService`; prompts as templates, rate-budgeted.
4. Expose city-level location only; never raw coordinates or emails in responses.
5. Every admin mutation writes `AdminAuditLog`.
6. DTO validation (class-validator) on every endpoint; secrets via env only.
7. i18n from day one: French default, English supported.

## Brand tokens

Pink `#D6336C` · Gold `#C9A24B` · Cream `#FAF3EC` · Text `#2B2B2B` · rounded-2xl cards, soft shadows, Poppins-style sans. Full visual spec: [docs/design-references.md](docs/design-references.md).
