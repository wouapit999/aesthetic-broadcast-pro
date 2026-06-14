# ✨ Aesthetic-Broadcast Pro — Vercel Edition

A **WhatsApp marketing & broadcasting platform for aesthetic shops**, packaged as a
single **Next.js 14** app that deploys to **Vercel in one click** — no separate
backend, no Redis, no always-on worker.

- Import contacts (CSV / manual), build dynamic segments, broadcast via the WhatsApp
  Cloud API, schedule campaigns, automate follow-ups, and track delivery / read /
  reply metrics.
- API is implemented with **Next.js Route Handlers** (`/app/api/**`).
- The high-volume send pipeline runs on **Vercel Cron** — large broadcasts are queued
  in the database and drained batch-by-batch every minute, so nothing needs a
  long-running process.

> Need the self-hostable version with Express + BullMQ + Redis + Docker? See the
> sibling project `aesthetic-broadcast-pro/`.

---

## 🧱 Stack

| Layer    | Technology |
|----------|------------|
| App      | Next.js 14 (App Router), TypeScript, TailwindCSS |
| API      | Next.js Route Handlers (`/app/api`) |
| DB       | PostgreSQL + Prisma 7 (pg driver adapter) |
| Queue    | DB-backed queue drained by **Vercel Cron** (`/api/cron/dispatch`) |
| Auth     | JWT (email/password, admin role) |
| Hosting  | Vercel |

---

## 🚀 Deploy to Vercel

### 1. Push to GitHub
```bash
cd aesthetic-broadcast-vercel
git init && git add . && git commit -m "Aesthetic-Broadcast Pro (Vercel)"
gh repo create aesthetic-broadcast-pro --public --source=. --push
```

### 2. Create a serverless Postgres database
Use any Postgres provider. Easiest options:
- **Vercel Postgres** (Storage tab → Create → Postgres), or
- **Neon** / **Supabase** (free tier).

Copy the **pooled** connection string (Neon pooler host, Supabase port `6543`, or the
Vercel-provided `POSTGRES_PRISMA_URL`). A pooled URL is important for serverless.

### 3. Import the repo on Vercel
[vercel.com/new](https://vercel.com/new) → import your repo. Add these **Environment
Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | your pooled Postgres URL |
| `JWT_SECRET` | a long random string |
| `ADMIN_EMAIL` | `admin@aesthetic.shop` |
| `ADMIN_PASSWORD` | a strong password |
| `CRON_SECRET` | a random string (protects the cron route) |
| `ANTHROPIC_API_KEY` | *(optional)* enables real AI copy |

Click **Deploy**. The build runs `prisma generate` automatically.

### 4. Create the tables + seed (once)
From your machine, pointed at the same `DATABASE_URL`:
```bash
npm install
echo 'DATABASE_URL="...your url..."' > .env
echo 'ADMIN_EMAIL="admin@aesthetic.shop"' >> .env
echo 'ADMIN_PASSWORD="ChangeMe123!"' >> .env
npm run prisma:deploy   # apply committed migrations (prisma/migrations/)
npm run seed            # admin user + sample data
```
A baseline migration (`prisma/migrations/0_init`) is committed, so
`prisma migrate deploy` creates the full schema. Prefer a schema-only sync
instead? Use `npm run prisma:push`.

### 5. Cron
`vercel.json` already registers a cron hitting `/api/cron/dispatch` every minute. On
the Hobby plan Vercel runs project crons at least daily; upgrade for per-minute
cadence, **or** trigger the endpoint yourself (e.g. cron-job.org calling it with the
`Authorization: Bearer <CRON_SECRET>` header). Sends also kick off a first batch
immediately when you press **Send**, so small campaigns go out at once.

---

## 🛠️ Run locally

Requires Node 20+ and a Postgres URL.

```bash
cd aesthetic-broadcast-vercel
cp .env.example .env        # set DATABASE_URL + JWT_SECRET
npm install
npm run prisma:push
npm run seed
npm run dev                 # http://localhost:3000
```

Drain the queue locally (since there's no Vercel Cron):
```bash
curl http://localhost:3000/api/cron/dispatch     # leave CRON_SECRET empty in dev
```

Login with the seeded admin (`admin@aesthetic.shop` / your `ADMIN_PASSWORD`).

---

## 💬 WhatsApp Cloud API

1. In **Settings → WhatsApp Business API**, paste your Phone Number ID, Business
   Account ID, permanent Access Token, and a Webhook Verify Token.
2. Copy the **auto-generated Webhook Callback URL** (`https://<your-app>/api/whatsapp/webhook`)
   into the Meta dashboard with the same verify token; subscribe to `messages`.
3. Click **Test connection** → status turns **● Connected**.

> WhatsApp requires **pre-approved templates** to start conversations outside the 24h
> window. Use approved templates for production marketing blasts; the free-form sender
> here is for testing and in-window replies.

---

## 📁 Structure

```
src/
├── app/
│   ├── (app)/            # dashboard, contacts, segments, campaigns,
│   │                     #   templates, automation, settings (UI)
│   ├── login/ , page.tsx , layout.tsx
│   └── api/              # route handlers (auth, contacts, segments, campaigns,
│       │                 #   templates, automations, settings, whatsapp, ai,
│       │                 #   dashboard, cron/dispatch)
├── components/           # Sidebar, CampaignBuilder, SegmentBuilder, etc.
├── server/               # prisma, env, auth, whatsapp, segment, dispatch
└── lib/                  # client api fetcher, formatters
prisma/schema.prisma
vercel.json               # cron config
```

## 📜 License
MIT
