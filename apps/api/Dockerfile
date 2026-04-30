# syntax=docker/dockerfile:1.7

# ---------- 1. Base ----------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ---------- 2. Deps (cached layer) ----------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile=false

# ---------- 3. Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @pms/api prisma generate
RUN pnpm --filter @pms/api build

# ---------- 4. Runtime ----------
FROM base AS runner
ENV NODE_ENV=production
ENV API_PORT=4000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/package.json ./

# Persist uploads across container restarts (mount a volume in Railway/Fly)
RUN mkdir -p /app/apps/api/uploads/rooms /app/apps/api/uploads/slips
VOLUME ["/app/apps/api/uploads"]

WORKDIR /app/apps/api
EXPOSE 4000

# Apply pending migrations on every boot, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
