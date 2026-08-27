# UnikaLove — Product Requirements Document (PRD)

> **Tagline:** Connecter les cœurs, célébrer l'amour — *L'amour n'a pas de frontières.*
> **Version:** 1.0 · **Date:** 2026-08-26 · **Status:** Approved foundation

---

## 1. Vision

UnikaLove is an AI-powered dating SaaS built for Africa first (Francophone and Anglophone) and the African diaspora worldwide. It focuses on **quality matches and meaningful connections instead of endless swiping**, using AI to continuously learn from each user's preferences and interactions while keeping the user in control.

## 2. Problems We Solve

| Problem | Our Solution |
|---|---|
| Fake profiles & scammers | Identity/photo verification + AI fake/scam/spam detection |
| Poor, random matches | AI compatibility scoring, personalized discovery that learns over time |
| Ghosting & dead conversations | AI conversation starters, reply suggestions, re-engagement nudges |
| Unsafe interactions | AI moderation of profiles/messages/media, block/report tools, privacy-first calls |
| Boring conversations | AI icebreakers, shared-interest prompts, GIFs/reactions |
| Dating fatigue | Curated Daily Picks (limited, high-quality) instead of infinite swipe |
| Hard to find compatible people | Deep preference model: values, interests, lifestyle, location, intent |

## 3. Target Market & Users

- **Primary:** singles in Francophone & Anglophone Africa (Cameroon, Côte d'Ivoire, Senegal, Nigeria, Ghana, Kenya…)
- **Secondary:** African diaspora (Europe, North America) — "Africains & amoureux du monde entier"
- **Languages:** French-first UI, full English support (i18n from day one)

### Personas
1. **Free user** — discovers, gets limited likes/day, basic filters, can chat with matches
2. **Premium user** — unlimited likes, super likes, advanced filters, sees who liked them, boosts, AI coach
3. **Moderator** — reviews reports, verification requests, flagged content
4. **Admin / Super Admin** — full platform management, analytics, payments, settings

## 4. Feature Requirements

### 4.1 Auth & Onboarding
- Signup/login: email + password, Google, Facebook, Apple (matching the brand signup card)
- Email verification, password reset, account recovery
- Guided onboarding: photos, bio, interests, preferences, location, dating intent
- Profile completeness meter with nudges (as in the user-dashboard mockup)

### 4.2 Profiles & Verification
- Photos (multi-upload, ordering, AI moderation on upload)
- Interests tags, bio, work/education, lifestyle fields, location (city-level display)
- **Verified badge**: selfie/photo verification flow reviewed by AI + moderator
- AI-generated profile improvement suggestions

### 4.3 Matching & Discovery
- AI compatibility score per candidate pair (preferences, interests, behavior signals)
- Swipe/discovery deck: pass ✕, favorite ★, like ♥; super likes; mutual match creation
- **Daily Picks**: small curated set, refreshed daily (anti-fatigue differentiator)
- Advanced filters (age, distance, interests, intent, verified-only) — premium gates some
- "Who liked you" (premium), favorites/bookmarks
- Geolocation-based discovery (distance radius)

### 4.4 Messaging & Calls
- Real-time chat between mutual matches only
- Typing indicators, read receipts, reactions, GIFs, photo sharing (moderated)
- AI conversation starters & reply suggestions in-thread
- Voice & video calling with privacy controls (no number exchange; block mid-call)

### 4.5 AI Assistant (Coach)
- Dating/coaching assistant chat (powered by Claude API)
- Date planning & activity recommendations (local, budget-aware)
- Respectful-communication guidance; ghosting-recovery suggestions

### 4.6 Safety & Moderation
- AI moderation for profiles, messages, and uploaded content (text + image)
- Fake/scam/spam detection with risk scores feeding the admin queue
- Block, report (with categories), safety tips center
- Moderator review queues with audit trail

### 4.7 Community
- Events & interest-based groups/communities (Phase 5+)

### 4.8 Notifications
- Push + email + in-app: new match, message, like, verification result, subscription events
- Reminders/re-engagement, per-channel user controls

### 4.9 Monetization (SaaS revenue)
- **Plans:** Free / **Premium** / **Premium+** — monthly & discounted quarterly/annual
- **Credits:** boosts, super likes, profile spotlight (à-la-carte)
- Coupons/promo codes, referral rewards (free premium days)
- **Payments:** **Stripe first** (cards, diaspora), **Flutterwave later** (Mobile Money: MTN MoMo, Orange Money — Africa)
- Pricing philosophy: priced for the African market — anchored on operating expenses + value delivered, with regional pricing capability
- In-app upsells: "Go Premium" panel, "Boost Profile" banner (as in mockup)

### 4.10 Privacy & Compliance
- Consent management, granular privacy controls (hide distance/age, incognito for premium)
- Data export & account deletion (GDPR-style), account recovery
- Minimum age 18, terms & community guidelines acceptance

### 4.11 Admin Dashboard (matches the admin mockup)
Sections: **Dashboard** (KPIs: total users, matches, conversations, revenue; user-growth chart; matches overview donut; gender distribution; top active users; recent activity feed) · **Users** (search, view, suspend/ban, verify) · **Matches** · **Conversations** (metadata/moderation view) · **Payments** (transactions, refunds, subscriptions) · **Reports** (moderation queue) · **Content Management** (tips, banners, community guidelines) · **App Settings** · **Notifications** (broadcast campaigns) · **Support** — with RBAC and 2FA.

### 4.12 Analytics
- Engagement, matches, retention cohorts, conversion funnel, revenue/MRR, churn

## 5. Non-Functional Requirements
- Responsive web app; API designed mobile-ready (future iOS/Android apps)
- Scalable backend (see ARCHITECTURE.md): PostgreSQL, Redis, WebSockets, object storage, search, geolocation, caching, logging, security hardening
- P95 API latency < 300ms; chat delivery < 1s; 99.9% uptime target
- Security: OWASP top-10 hardening, rate limiting, encrypted sensitive data, audit logs

## 6. Success Metrics
- Activation: % completing profile within 24h
- Match quality: mutual-match rate, conversation rate per match, 7-day reply rate
- Retention: D7/D30; Conversion: free→premium %; Revenue: MRR, ARPU, churn

## 7. Roadmap (build order)

| Phase | Scope |
|---|---|
| **1 — Backend core** | NestJS API: auth, users, profiles, matching, discovery, messaging (WebSocket), safety primitives, Prisma schema, Redis, seed data |
| **2 — Admin dashboard** | Next.js admin app reproducing the mockup, wired to the API; moderation & user management |
| **3 — User web app** | DateLuxe-style user dashboard: discover, likes, matches, messages, profile, settings |
| **4 — Landing page** | Framer-style animated landing with `assets/video/header-bg.mp4` hero background, brand identity, signup CTA |
| **5 — AI + payments** | Claude-powered matching/coach/moderation depth, Stripe subscriptions, then Flutterwave, events/communities, calls |

## 8. Out of Scope (v1)
Native mobile apps (architecture-ready only) · Flutterwave at launch (Stripe first) · Livestreaming.
