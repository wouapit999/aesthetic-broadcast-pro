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
| Queue    | DB-backed queue drained by a scheduled job (`/api/cron/dispatch`) |
| Auth     | JWT (email/password, admin role) |
| Hosting  | Netlify (or Vercel) |

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

### 3. Import the repo on Netlify
[app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing
project** → pick your GitHub repo. Netlify auto-detects Next.js (`netlify.toml` pins
the official `@netlify/plugin-nextjs` runtime and Node 20). Before deploying, add these
**Environment variables** (Site configuration → Environment variables):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | your pooled Postgres URL |
| `JWT_SECRET` | a long random string |
| `ADMIN_EMAIL` | `admin@aesthetic.shop` |
| `ADMIN_PASSWORD` | a strong password |
| `CRON_SECRET` | a random string (protects the dispatch route) |
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

### 5. Scheduled sending
`netlify/functions/dispatch.mjs` is a **Netlify Scheduled Function** that runs every
minute and calls `/api/cron/dispatch` (authenticated with `CRON_SECRET`) to drain the
send queue. It works automatically once deployed — no extra setup. Sends also kick off
a first batch immediately when you press **Send**, so small campaigns go out at once.

> **Deploying on Vercel instead?** `vercel.json` already registers an equivalent Vercel
> Cron on the same `/api/cron/dispatch` route, so the project deploys to either host.

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
