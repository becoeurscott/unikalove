# --- Build stage -------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Workspace manifests first so dependency layers cache well.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api

WORKDIR /app/apps/api
RUN npx prisma generate && npm run build

# --- Runtime stage -----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY apps/api/prisma apps/api/prisma
COPY packages/shared packages/shared

WORKDIR /app/apps/api
EXPOSE 4000

# Apply pending migrations, then boot. Fails fast if the database is unreachable.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
