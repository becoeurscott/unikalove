# Implementation Plan — Phase 5: AI Features + Payments

Brings the two headline capabilities online behind the interfaces built in Phase 1
(`AiService`, `PaymentProvider` — AGENTS.md hard rules 1 & 3), so no business logic moves.

**Key handling:** both integrations degrade gracefully. No `ANTHROPIC_API_KEY` → the existing
`StubAiService` stays wired (deterministic French fallbacks). No `STRIPE_SECRET_KEY` → checkout
returns 501 and the UI shows "bientôt disponible". Nothing breaks without keys; adding a key to
`.env` switches the real provider on at boot.

## A. AI (Claude) — `apps/api/src/modules/ai`
- `[NEW] claude-ai.service.ts` — `ClaudeAiService implements AiService` using `@anthropic-ai/sdk`
  (model `claude-sonnet-5`), one prompt template per feature, JSON-mode responses parsed defensively,
  per-user daily call budget in Redis (`ai:budget:<userId>:<yyyy-mm-dd>`), 8s timeout, failures fall
  back to the stub result rather than erroring the request.
- `[MODIFY] ai.module.ts` — provider factory: pick Claude when the key exists, else stub.
- `[NEW] ai.controller.ts` + dto:
  - `GET  /ai/profile-suggestions` — improvements for my own profile
  - `GET  /ai/starters/:conversationId` — icebreakers from both profiles
  - `POST /ai/reply-suggestions` — 3 reply options for the last message
  - `POST /ai/coach` — dating-coach chat (message + short history)
- `[MODIFY] discovery.service.ts` — blend AI compatibility into ranking: heuristic score stays the
  base, AI score (cached per pair in Redis, 24h) re-ranks the top 20 only, to bound cost.
- `[MODIFY] messaging.service.ts` + `profiles.service.ts` — run `moderateText` on outgoing messages
  and saved bios; flagged content creates a `Report` (category `INAPPROPRIATE_CONTENT`, reporter =
  the system admin) so it lands in the existing moderation queue.

## B. Payments (Stripe first) — `apps/api/src/modules/payments`
- `[MODIFY] stripe.provider.ts` — real implementation: Checkout Session (subscription mode,
  price IDs from env per plan), `cancelSubscription`, `handleWebhook` with signature verification.
- `[NEW] payments.controller.ts`:
  - `POST /payments/checkout` `{plan}` → `{url}` (authenticated)
  - `POST /payments/webhook` — **raw body**, no auth, no global validation pipe
  - `POST /payments/cancel`
  - `GET  /payments/me` — my subscription + history
- `[MODIFY] main.ts` — `rawBody: true` so webhook signatures verify.
- `[MODIFY] subscriptions.service.ts` — webhook events drive `Subscription` rows and sync
  `User.plan`; grace period on `past_due`.
- `[NEW] admin`: `GET /admin/payments` (transactions + MRR aggregate) feeding the admin Payments page.
- `.env.example` gains `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_PREMIUM_PLUS`, `APP_URL`.

## C. Frontends
- `[MODIFY] apps/web`: real AI icebreakers in chat (replace the hardcoded three), reply-suggestion
  chips, profile-suggestions card on `/profile`, new `/coach` page, and "Mettre à niveau" →
  `/payments/checkout` redirect; success/cancel return routes.
- `[MODIFY] apps/admin`: Payments page renders real transactions + MRR instead of the placeholder.

## Not in this phase
Flutterwave/Mobile Money (adapter slot ready), voice/video calls, events & communities, OAuth keys.

## Verification
1. `npm run build` passes for api, web, admin.
2. **Without keys** (current machine state): AI endpoints return stub French text; `/payments/checkout`
   returns 501; nothing 500s. Smoke-test this path end to end.
3. **With keys** (if you supply them): checkout redirects to Stripe test checkout; `stripe listen`
   webhook flips the user to PREMIUM and unlocks `/likes/received`.
4. Moderation: send a message with flagged content → a Report appears in the admin queue.
