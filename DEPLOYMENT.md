# Deployment

Two pieces: the **API** (Render — needs a persistent container for WebSockets)
and the **frontends** (Vercel — static/SSR Next.js).

## 1. API → Render

The repo contains `render.yaml`, so Render can provision everything in one go:
the Docker web service, a Postgres database, and a Redis (Key Value) instance.

Live services (created 2026-08-27, Frankfurt region, free plans):
- `unikalove-api` — https://unikalove-api.onrender.com (`srv-da86nm49v7es73eqcko0`)
- `unikalove-redis` — Key Value (`red-da86n8mk1f9s73cf2cq0`)

Postgres is hosted on **Supabase**, not Render.

1. Push to GitHub (already done).
2. Create a Supabase project in a region near Frankfurt (`eu-central-1`).
3. Supabase → Project Settings → Database → Connection string. Copy **both**:
   - **Transaction pooler** (port 6543) → `DATABASE_URL`, append `?pgbouncer=true`
   - **Direct connection** (port 5432) → `DIRECT_URL` (used only by `prisma migrate`)
4. Fill the secrets marked `sync: false` in the Render dashboard:
   - `DATABASE_URL` and `DIRECT_URL` — from Supabase (step 3)
   - `OPENROUTER_API_KEY` — your OpenRouter key
   - `CORS_ORIGINS` — comma-separated frontend URLs, e.g.
     `https://admindashbaord-unikalove.vercel.app,https://unikalove.vercel.app`
   - `APP_URL` — the user app URL (used for Stripe redirects)
   - Stripe keys when you have them
5. First boot runs `prisma migrate deploy` automatically (see the Dockerfile CMD).

### Seeding production
The seed script creates demo accounts with **publicly known passwords** and must
not run against a real database. Create your admin account instead:

```bash
# From Render → unikalove-api → Shell
node -e "
const {PrismaClient}=require('@prisma/client');const b=require('bcryptjs');
(async()=>{const p=new PrismaClient();
await p.user.create({data:{email:'YOU@example.com',passwordHash:await b.hash('A-STRONG-PASSWORD',10),role:'SUPER_ADMIN',emailVerifiedAt:new Date()}});
console.log('admin created');await p.\$disconnect();})()"
```

### Free-tier caveats
- The Render web service **sleeps after ~15 minutes idle**; the next request takes
  ~30-60s to wake. Realtime chat drops while asleep.
- Supabase **pauses free projects after ~1 week of inactivity** — restore them from
  the Supabase dashboard.
- Upgrade the web service to Starter (~$7/mo) for always-on before real users.

## 2. Frontends → Vercel

Each app is a separate Vercel project rooted in its own directory:

| App | Root directory | Suggested project |
|---|---|---|
| Admin dashboard | `apps/admin` | `admindashbaord-unikalove` |
| User app | `apps/web` | `unikalove-app` |
| Landing page | `apps/landing` | `unikalove` |

Set on each project (Settings → Environment Variables):
- `NEXT_PUBLIC_API_URL` = `https://unikalove-api.onrender.com/api/v1`
- user app also needs `NEXT_PUBLIC_WS_URL` = `https://unikalove-api.onrender.com`
- landing needs `NEXT_PUBLIC_APP_URL` = the deployed user-app URL

Then add every frontend origin to the API's `CORS_ORIGINS` on Render and redeploy it.

## Security checklist before real users
- [ ] Rotate `OPENROUTER_API_KEY` (it was shared in plaintext during development)
- [ ] Never run `prisma/seed.ts` against production — demo passwords are in the public repo
- [ ] Change the admin password from the seeded `Admin123!unika`
- [ ] Confirm `.env` files are still gitignored
- [ ] Upgrade off free tiers so the DB does not expire
