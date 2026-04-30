# PMS — Property Management System with Direct Booking

Turborepo monorepo:
- `apps/web` — Next.js 14 (App Router) — Admin Dashboard + Direct Booking
- `apps/api` — NestJS REST API
- `packages/types` — Shared TypeScript contracts

Tech: Next.js · NestJS · Prisma · PostgreSQL · NextAuth v5 · Stripe · Resend · Tailwind.

---

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment

Copy `.env.example` files and fill in values:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The `JWT_SECRET` (api) **must** match `NEXTAUTH_SECRET` (web) so JWTs minted by the API are accepted by NextAuth and vice-versa.

Generate one with:
```bash
openssl rand -base64 32
```

### 3. Database

Start Postgres locally (Docker example):

```bash
docker run -d --name pms-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pms \
  postgres:16
```

Run migrations + seed:

```bash
pnpm db:migrate     # creates tables
pnpm db:seed        # adds 2 room types + 365 days of rates + admin user
```

### Default credentials (after seed)

| Role  | Email                 | Password    | Login URL                                      |
| ----- | --------------------- | ----------- | ---------------------------------------------- |
| Admin | `admin@example.com`   | `admin1234` | http://localhost:3000/admin/login              |

> เปลี่ยนรหัสผ่านในโปรดักชันก่อนเปิดให้ใช้งานจริง — ค่านี้ตั้งไว้สำหรับ dev เท่านั้น (ดูได้ที่ [apps/api/prisma/seed.ts](apps/api/prisma/seed.ts))

### 4. Run

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000

---

## Stripe

In dev without Stripe keys the app uses a **dev-checkout** stub page that lets you simulate a successful payment.

Production setup:
1. Add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to `apps/api/.env` and `apps/web/.env.local`.
2. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:4000/webhooks/stripe
   ```
   Copy the `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

The webhook handler is **idempotent** — it checks `stripeSessionId` before mutating the booking, so Stripe's automatic retries are safe.

## Email

Set `RESEND_API_KEY`. Without it, emails are logged to the API console (dev mode).

## Google OAuth (optional)

Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `apps/web/.env.local`. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.

---

## Architecture

### Booking flow
```
/book → search availability → pick room → enter guest info
     → POST /api/bookings (creates PENDING booking + Stripe session)
     → Stripe Checkout
     → checkout.session.completed webhook → CONFIRMED + PAID + email
     → /booking/:id/confirmation
```

### Availability invariant
```
availableUnits = totalUnits - count(CONFIRMED bookings overlapping range)
overlap: booking.checkIn < range.checkOut AND booking.checkOut > range.checkIn
```
Back-to-back bookings (one's checkOut == another's checkIn) do **not** overlap.

### Cancellation
All sales final — no refund logic. Admin can cancel which removes the booking from inventory but issues no refund.

### Rate Calendar
Per-day prices; if any night in a requested range has no rate, the booking is **blocked** (won't be available in search).

---

## Useful commands

```bash
pnpm dev               # run web + api
pnpm build             # build everything
pnpm test              # run jest in api

pnpm db:migrate        # prisma migrate dev
pnpm db:seed           # seed
pnpm db:studio         # prisma studio

# Inside apps/api:
pnpm prisma migrate deploy   # production migration
```

---

## Deployment

- **apps/web** → Vercel. Set all `NEXT_PUBLIC_*`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, OAuth, and `JWT_SECRET`.
- **apps/api** → Railway / Fly.io / Render. Run `prisma migrate deploy` on boot. Configure Stripe webhook to hit `https://api.yoursite.com/webhooks/stripe`.
- **PostgreSQL** → Railway, Neon, Supabase, or Fly.

---

## Out of scope (not in v1)

Coupons, multi-language, multi-property, channel manager, room assignment, housekeeping module, SMS, revenue dashboard.
