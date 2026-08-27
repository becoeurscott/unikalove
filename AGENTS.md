# AGENTS.md — Instructions for AI agents working in this repo

## What this project is

**UnikaLove** — an AI-powered dating SaaS for Africa (French-first, English support) and the diaspora. Monorepo: NestJS API + three Next.js apps. Read [ARCHITECTURE-ESSENTIALS.md](ARCHITECTURE-ESSENTIALS.md) before touching code; [PRD.md](PRD.md) for product scope; [ARCHITECTURE.md](ARCHITECTURE.md) for full technical detail; [docs/design-references.md](docs/design-references.md) for the visual spec.

## Build order (do not skip ahead)

1. `apps/api` — backend core (auth, users, profiles, matching, discovery, messaging, safety)
2. `apps/admin` — admin dashboard wired to the API
3. `apps/web` — user app (DateLuxe-style dashboard)
4. `apps/landing` — Framer-style animated landing (hero video: `assets/video/header-bg.mp4`)
5. AI depth + payments (Stripe first, Flutterwave later)

## Conventions

- **Backend:** one NestJS module per domain (`module/controller/service/dto/entities`), DTOs validated with class-validator, Prisma for all DB access, migrations committed (`prisma migrate dev`), UUID PKs, soft deletes for user content
- **Frontend:** Next.js App Router, Tailwind, TanStack Query, components in PascalCase, brand tokens from design-references (pink `#D6336C`, gold `#C9A24B`, cream `#FAF3EC`)
- **i18n:** every user-facing string goes through next-intl; French is the default locale, English required
- **Commits:** conventional commits (`feat(api): …`, `fix(admin): …`); small, scoped
- **Types shared between API and frontends live in `packages/shared`** — never duplicate enums/DTO shapes

## Hard rules (never violate)

1. **No payment-provider logic outside `payments` adapters** — everything goes through the `PaymentProvider` interface (Stripe now, Flutterwave later)
2. **No secrets in code** — env vars only; keep `.env.example` updated
3. **All AI calls through `AiService`** — no ad-hoc Claude/LLM calls scattered in modules
4. **Never expose** raw coordinates, emails, or auth internals in API responses
5. **Every admin mutation** writes an `AdminAuditLog` row
6. **No permanent data deletion** in user-facing flows — soft delete + GDPR-style export/erase jobs
7. Frontends talk to the backend **only** via the versioned REST/WebSocket API

## Verification expectations

After changes: run typecheck + lint + tests for the touched workspace; for API changes, confirm Swagger still generates and migrations apply cleanly on a fresh DB.
