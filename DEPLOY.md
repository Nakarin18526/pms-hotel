# Deployment Guide

ตาม PRD แนะนำ:
- **apps/web** → Vercel
- **apps/api** → Railway (หรือ Fly.io)
- **PostgreSQL** → Railway (เดียวกับ API) หรือ Neon / Supabase

คู่มือนี้ใช้ **Railway** เป็นหลักเพราะ setup ง่ายที่สุด — รวม API + DB ในที่เดียว

---

## Overview

```
┌──────────────┐         ┌──────────────────────┐
│  Vercel      │  HTTPS  │  Railway             │
│  apps/web    │ ──────▶ │  apps/api (NestJS)   │
│  Next.js     │         │       │              │
└──────────────┘         │       ▼              │
                         │  PostgreSQL          │
                         └──────────────────────┘
                              ▲
                              │ webhook
                         ┌────┴───────┐
                         │  Stripe    │
                         └────────────┘
```

---

## Part 1 — Push code ขึ้น GitHub

```bash
cd /Users/nakarin/Desktop/testpms
git init
git add .
git commit -m "initial commit"
gh repo create pms --private --source=. --push
# หรือ push ไป GitHub repo ที่สร้างเองด้วยมือ
```

---

## Part 2 — Deploy `apps/api` + PostgreSQL บน Railway

### 2.1 Sign up + create project
1. ไปที่ https://railway.app → Sign in with GitHub
2. คลิก **New Project** → **Deploy from GitHub repo** → เลือก repo ของคุณ

### 2.2 เพิ่ม PostgreSQL
1. ในหน้า project → คลิก **+ New** → **Database** → **PostgreSQL**
2. รอจน status เป็น Active — Railway จะสร้าง `DATABASE_URL` ให้เอง

### 2.3 Configure API service
1. คลิกที่ service ของ apps/api → **Settings**
2. **Root Directory:** เว้นว่าง (ใช้ root repo)
3. **Build:** Railway จะอ่าน [`apps/api/railway.json`](apps/api/railway.json) อัตโนมัติ → ใช้ Dockerfile
4. **Networking** → **Generate Domain** เพื่อให้ public URL (เช่น `pms-api-production.up.railway.app`)
5. **Variables** → กดปุ่ม **+ Reference** เลือก `DATABASE_URL` จาก Postgres service

### 2.4 ตั้ง environment variables (สำคัญ)

ที่ tab **Variables** เพิ่มต่อไปนี้:

```env
# Auto-referenced from Postgres service
DATABASE_URL=${{ Postgres.DATABASE_URL }}

# Server
NODE_ENV=production
API_PORT=4000
API_PUBLIC_URL=https://pms-api-production.up.railway.app  # ใส่ URL จริงที่ Railway ให้

# Locale
CURRENCY=THB
TIMEZONE=Asia/Bangkok

# Auth (ต้องตรงกับ NEXTAUTH_SECRET ฝั่ง web)
JWT_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://your-web-domain.vercel.app  # ใส่หลัง deploy web เสร็จ

# Stripe (ใช้ test keys ก่อนตาม PRD)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# PromptPay (ถ้าใช้ — เปลี่ยนใน /admin/payment-settings ก็ได้)
PROMPTPAY_ID=
PROMPTPAY_RECEIVER_NAME=

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM="Hotel <noreply@yourdomain.com>"
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com
```

### 2.5 Mount volume สำหรับ uploads (สำคัญ)

ไม่งั้นรูปห้อง + สลิปจะหายเมื่อ container restart

1. ที่ service → **Settings** → **Volumes** → **+ Mount Volume**
2. **Mount path:** `/app/apps/api/uploads`
3. **Size:** 1 GB ก็พอเริ่มต้น

### 2.6 Deploy + seed

1. กด **Deploy** — Railway build Dockerfile + รัน `prisma migrate deploy` อัตโนมัติ
2. หลัง deploy เสร็จ เข้า service → **Logs** → ดูว่ามี `API listening on http://localhost:4000` ไหม
3. ทดสอบ: `curl https://your-api.up.railway.app/health` → `{"status":"ok"}`

**Seed admin user ครั้งแรก:**
```bash
# Connect ผ่าน Railway CLI
npm i -g @railway/cli
railway login
railway link  # เลือก project
railway run --service api -- pnpm db:seed
```

---

## Part 3 — Deploy `apps/web` บน Vercel

### 3.1 Import project
1. ไปที่ https://vercel.com → Sign in with GitHub
2. **Add New** → **Project** → import repo เดียวกัน
3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** `apps/web`  ← **สำคัญ**
5. Vercel จะอ่าน [`apps/web/vercel.json`](apps/web/vercel.json) เพื่อ build แบบ monorepo

### 3.2 Environment Variables

ใน Vercel project settings → **Environment Variables**:

```env
# API URL (จาก Railway)
NEXT_PUBLIC_API_URL=https://pms-api-production.up.railway.app

# Locale
NEXT_PUBLIC_CURRENCY=THB

# NextAuth (ต้องตรงกับ JWT_SECRET ฝั่ง api)
NEXTAUTH_URL=https://your-web.vercel.app  # อัปเดตหลังได้ domain
NEXTAUTH_SECRET=<openssl rand -base64 32>
JWT_SECRET=<same as api JWT_SECRET>

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe (publishable key — public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### 3.3 Deploy
1. กด **Deploy**
2. หลัง deploy เสร็จ คัดลอก domain จาก Vercel
3. **กลับไป Railway** → อัปเดต `NEXTAUTH_URL` ให้เป็น Vercel domain → redeploy

### 3.4 อัปเดต Google OAuth redirect URI (ถ้าใช้)

ไป Google Cloud Console → OAuth Client → เพิ่ม:
```
https://your-web.vercel.app/api/auth/callback/google
```

---

## Part 4 — Stripe Webhook (สำคัญ!)

ไม่งั้นการจองที่จ่ายผ่าน Stripe จะค้างที่ PENDING ตลอด

1. ไป https://dashboard.stripe.com/webhooks → **Add endpoint**
2. **Endpoint URL:** `https://your-api.up.railway.app/webhooks/stripe`
3. **Events to listen:** `checkout.session.completed`
4. คัดลอก **Signing secret** (`whsec_...`) → ใส่ใน Railway env `STRIPE_WEBHOOK_SECRET`
5. Restart API

ทดสอบ:
```bash
stripe listen --forward-to https://your-api.up.railway.app/webhooks/stripe
stripe trigger checkout.session.completed
```

---

## Part 5 — Custom domain (optional)

### Vercel (web)
1. Project → **Domains** → Add `book.yourhotel.com`
2. ตั้ง CNAME ที่ DNS provider ตามที่ Vercel บอก
3. อัปเดต `NEXTAUTH_URL` ใน Vercel env เป็น domain ใหม่

### Railway (api)
1. Service → **Settings** → **Networking** → **Custom Domain** → `api.yourhotel.com`
2. ตั้ง CNAME ตามที่ Railway บอก
3. อัปเดต `NEXT_PUBLIC_API_URL` ใน Vercel + `NEXTAUTH_URL` ใน Railway + Stripe webhook URL

---

## Part 6 — Production hardening checklist

- [ ] เปลี่ยน Stripe เป็น **Live keys** (`sk_live_...`)
- [ ] เปลี่ยนรหัสผ่าน admin จาก default `admin1234`
- [ ] ตั้ง **PROMPTPAY_ID จริง** ที่ /admin/payment-settings
- [ ] ใส่ **DNS SPF/DKIM** ให้ Resend (เพื่อให้อีเมลไม่เข้า spam)
- [ ] เปิด Railway **PostgreSQL backup** (Settings → Backups)
- [ ] Vercel: เปิด **Web Analytics** + **Speed Insights**
- [ ] ตั้ง **GitHub branch protection** บน `main` — บังคับ PR review

---

## Alternative: Fly.io แทน Railway

ถ้าจะใช้ Fly.io:

```bash
brew install flyctl
fly auth signup
cd /Users/nakarin/Desktop/testpms
fly launch --no-deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile

# Postgres
fly postgres create --name pms-db --region sin
fly postgres attach pms-db --app pms-api

# Set secrets
fly secrets set --app pms-api \
  JWT_SECRET=$(openssl rand -base64 32) \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  RESEND_API_KEY=re_xxx \
  NEXTAUTH_URL=https://your-web.vercel.app

fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile
```

---

## Alternative: Database providers อื่น

| Provider | จุดเด่น | URL |
|---|---|---|
| **Railway Postgres** | ง่ายสุด รวมกับ API | https://railway.app |
| **Neon** | Serverless · มี free tier ใหญ่ · branching | https://neon.tech |
| **Supabase** | มี dashboard + auth (เผื่อใช้ในอนาคต) | https://supabase.com |
| **Fly Postgres** | ใกล้กับ apps/api ถ้าใช้ Fly | https://fly.io |

ทุกตัวให้ DATABASE_URL — ใส่ใน Railway `DATABASE_URL` env แทน reference ก็ได้

---

## Troubleshooting

| ปัญหา | ตรวจ |
|---|---|
| Web ขึ้น CORS error | API enabled CORS แล้ว ([main.ts](apps/api/src/main.ts)) — ถ้ายัง error ให้ดูว่า `NEXT_PUBLIC_API_URL` ตรงไหม |
| Login admin ไม่ผ่าน | `JWT_SECRET` ฝั่ง api ตรงกับ `NEXTAUTH_SECRET` ฝั่ง web ไหม |
| Stripe จ่ายแล้วไม่ confirm | Webhook URL ถูกไหม + `STRIPE_WEBHOOK_SECRET` ตรงไหม |
| รูปห้องหายหลัง redeploy | ลืม mount volume `/app/apps/api/uploads` |
| Migration fail | `pnpm prisma migrate deploy` (production) ≠ `migrate dev` — ต้องมี migration files commit เข้า repo |

---

ถ้าทำตามนี้ครบ — เว็บพร้อมรับ booking จริงได้ทันที
