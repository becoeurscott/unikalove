# Phase 5 Execution Checklist — COMPLETE ✅ (awaiting keys for live verification)

- [x] AI via **OpenRouter** (`anthropic/claude-opus-5` by default) behind the existing `AiService`
      interface — fetch-based client, no extra SDK. Falls back to `StubAiService` with French
      copy when `OPENROUTER_API_KEY` is absent or a call fails/times out.
- [x] AI endpoints: `/ai/profile-suggestions`, `/ai/starters/:conversationId`,
      `/ai/reply-suggestions`, `/ai/coach` + per-user daily budget (60 calls) in Redis
- [x] Discovery ranking blends heuristic 60% + AI compatibility 40%, AI score cached 24h per pair,
      re-ranking only the top 20 to bound cost
- [x] AI moderation on outgoing messages and bios → flagged content files a Report into the
      existing admin moderation queue (non-blocking, never breaks the user action)
- [x] Stripe: real provider (Checkout Session, cancel, signed webhooks), `rawBody` enabled,
      `/payments/{status,checkout,me,cancel,webhook}`, subscription→User.plan sync with
      past_due grace period, welcome/cancel notifications
- [x] `GET /admin/payments` (MRR estimate, active count, recent subscriptions)
- [x] RedisService added (caches, budgets) — degrades to no-op if Redis is down
- [x] Web app: Coach IA page, AI icebreakers + reply-suggestion chips in chat, AI profile
      advice card, "Mettre à niveau" → checkout redirect
- [x] Admin: Payments page with real MRR + subscription table
- [x] Builds pass: api, web, admin
- [x] **Smoke test 10/10** with no keys: AI returns French stubs, checkout 501s, webhook rejects
      unsigned payloads, admin RBAC holds, discovery still ranks

## To go live
Add to `apps/api/.env` then restart the API:
- `OPENROUTER_API_KEY=sk-or-...` (optionally `OPENROUTER_MODEL=anthropic/claude-sonnet-5` for ~2.5x cheaper)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_PREMIUM_PLUS`

---

# Phase 4 Execution Checklist — COMPLETE ✅

- [x] apps/landing scaffold (Next.js 15, port 3002, Poppins, Framer Motion + Lenis smooth scroll)
- [x] Sticky nav: transparent-on-hero → white/blur condensed on scroll, wordmark color transition
- [x] Hero: header-bg.mp4 full-bleed (muted/loop/playsInline, reduced-motion fallback), glow logo PNG (mix-blend-screen), staggered word-reveal headline, signup card (email + OAuth CTAs → app /register)
- [x] Features (4 pillars from the identity poster), Comment ça marche (3 steps), Showcase (parallax floating match/chat cards + loop.mp4 in device frame)
- [x] Pricing FCFA (Gratuit / Premium 2 500 / Premium+ 5 000 — placeholder amounts), Testimonials (illustrative), dark Final CTA with glow logo + pink/gold wave, pink footer
- [x] `npm run build` passes · browser-verified scroll-through (hero → sections → footer)

Run: `npm run dev --workspace @unikalove/landing` → http://localhost:3002

---

# Phase 3 Execution Checklist — COMPLETE ✅

- [x] API additions: `GET /swipes/favorites`, `GET /matching/counts`, richer discovery feed (bio, intent, photo, interests) + null-location fix
- [x] apps/web scaffold (Next.js 15, port 3000), silent token refresh in the API client
- [x] Login + Register (brand signup card, OAuth buttons disabled "bientôt disponible")
- [x] Onboarding wizard (3 steps: profil → intérêts → préférences, geolocation opt-in)
- [x] Dashboard: greeting, discover cards (✕ ★ ♥), sélection du jour, completeness ring, qui vous a aimé (premium hook), matches rail, conseils de sécurité, boost banner
- [x] Discover deck, Likes (403 → premium upsell), Matches (unmatch), Bookmarks
- [x] Messages: conversation list + realtime chat (Socket.IO: message/typing/read), icebreaker chips
- [x] Profile editor (bio, photos par URL, intérêts, vérification) + Settings (préférences, blocages, suppression de compte)
- [x] `npm run build` passes (13 routes)
- [x] Browser-verified: register → onboarding → dashboard feed → like → mutual match → chat message sent live ("Team thé ou café ? ☕" · Envoyé)

Run: `npm run dev --workspace @unikalove/web` → http://localhost:3000 · demo login: aicha0@demo.unikalove.com / Demo123!unika

---

# Phase 2 Execution Checklist — COMPLETE ✅

- [x] API additions: `GET /admin/top-users`, `GET /admin/activity`
- [x] apps/admin scaffold (Next.js 15, Tailwind, TanStack Query, Recharts)
- [x] Brand login page with staff-role gate (MODERATOR+ only)
- [x] Sidebar layout matching mockup (10 sections + logout + admin chip)
- [x] Dashboard: 4 KPI cards, User Growth chart, Matches/Gender donuts, Top Active Users, Recent Activity
- [x] Users page: search, table, suspend/ban/reactivate
- [x] Reports page: report queue resolve/dismiss + verification approve/reject
- [x] Placeholder pages (matches, conversations, payments, content, settings, notifications, support)
- [x] `npm run build` passes (14 routes)
- [x] Browser-verified against live API: login → dashboard live data → report resolved in UI

Run: `npm run dev --workspace @unikalove/admin` → http://localhost:3001 (API must be running on :4000)

---

# Phase 1 Execution Checklist — COMPLETE ✅

- [x] docker-compose.yml (postgres+postgis on 5433, redis on 6380 — 5432/6379 were taken by another project)
- [x] packages/shared (enums + types)
- [x] apps/api scaffold (package.json, tsconfig, nest-cli, env)
- [x] prisma/schema.prisma + seed.ts (20 demo users + admin@unikalove.com)
- [x] common/ (filters, guards, decorators, pagination)
- [x] auth module (JWT + rotating refresh cookie, password reset, OAuth 501 stubs)
- [x] users module (soft delete, status management)
- [x] profiles module (CRUD, preferences, interests, photos, completeness, verification)
- [x] discovery module (Haversine feed + daily picks)
- [x] matching module (swipes, FREE quota, mutual match, who-liked-you premium gate)
- [x] messaging module (REST history + Socket.IO gateway: send/typing/read/reaction)
- [x] safety module (reports, blocks — block auto-unmatches)
- [x] admin module (KPIs, user management, report/verification review, audit log)
- [x] stub modules (ai, payments/Stripe, subscriptions, notifications, media)
- [x] npm install
- [x] docker compose up + migrate + seed
- [x] npm run build passes
- [x] smoke test **16/16 passed** (register → profile → discovery → mutual match → WebSocket chat → RBAC → premium gates)

## Dev quickstart
```
docker compose up -d
cd apps/api
npm run dev          # API on http://localhost:4000/api/docs
```
Seed accounts: `admin@unikalove.com` / `Admin123!unika` (SUPER_ADMIN) · `aicha0@demo.unikalove.com` etc. / `Demo123!unika`
