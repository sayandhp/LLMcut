# LLMcut

> AI-powered video clipping — queue long-form videos, let an AI worker extract highlights, caption and render vertical clips, then auto-post to TikTok, YouTube Shorts, and Instagram Reels.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Database & Auth | Supabase (PostgreSQL + RLS + Auth) |
| Production server | Node.js HTTP static server (`server/production.js`) |
| Deployment | Railway (via `railway.json`) |
| Styling | Pure CSS custom properties — zero CSS framework |
| Icons | Lucide React |

---

## Features

- **4-step clip wizard** — paste a URL, pick an AI model, set clip length / caption style / format, save to queue
- **Supabase-backed** — all jobs, clips, and publish queue entries are stored in Postgres with owner-scoped RLS
- **Email / password auth** — sign-up and sign-in via Supabase Auth; every row is private to its owner
- **Clip library** — grid/list view, filter by status, search, delete
- **Publish queue** — assign clips to YouTube / TikTok / Reels / Twitter, set a scheduled time
- **Live stream capture UI** — real-time signal meters, chat feed, auto-detected highlight list (UI ready; worker TBD)
- **Settings** — AI provider keys, theme, notification preferences, account info

## Database schema

Four tables in `supabase/migrations/20261117153411_llmcut_core_schema.sql`:

| Table | Description |
|---|---|
| `processing_jobs` | Video URL + AI/output settings; status lifecycle |
| `clips` | Individual clip records with score, duration, media URL |
| `publish_queue` | Per-platform post entries with scheduled time and status |
| `app_settings` | Key-value store for per-user preferences |

RLS is enabled on every table. All policies use `auth.uid()` — no row is readable by another user.

---

## Local development

### 1. Prerequisites

- Node.js >= 22.13
- A [Supabase](https://supabase.com) project (free tier works)

### 2. Environment

```bash
cp .env.example .env.local
# Edit .env.local and fill in your Supabase URL and publishable key
# Find both values in: Supabase Dashboard -> Project Settings -> API
```

### 3. Apply the schema

Run the migration in the Supabase SQL editor:

```
supabase/migrations/20261117153411_llmcut_core_schema.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 4. Add auth redirect URLs

In the Supabase dashboard -> Authentication -> URL Configuration, add:

```
http://localhost:5173/**
```

### 5. Run the dev server

```bash
npm install
npm run dev
# -> http://localhost:5173
```

---

## Deployment to Railway

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial LLMcut build"
git push
```

### 2. Create a Railway service

1. Go to [railway.app](https://railway.app) -> New Project -> Deploy from GitHub repo
2. Select this repository

### 3. Set environment variables

In Railway -> Variables, add the two environment variables from `.env.example`.
Find the values in: **Supabase Dashboard -> Project Settings -> API**.

| Key | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard -> Project Settings -> API -> Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard -> Project Settings -> API -> Publishable key |

> **Note:** The publishable key is intentionally public and safe for browser use. Never set a Supabase **secret key** as an environment variable in a frontend build.

### 4. Add your Railway domain to Supabase

Authentication -> URL Configuration -> add `https://your-app.up.railway.app/**`

Railway will auto-build (`npm run build`) and start (`npm start`) from `railway.json`.

---

## Project structure

```
src/
  lib/
    supabase.js      # Supabase client init
    api.js           # Supabase + local API abstraction
  components/
    Sidebar.jsx
    Topbar.jsx
  pages/
    Dashboard.jsx    # Stats, jobs, recent clips
    NewClip.jsx      # 4-step wizard -> createJob()
    Clips.jsx        # Clip library with search/filter
    Publish.jsx      # Publish queue management
    LiveStream.jsx   # Live capture UI
    Settings.jsx     # AI keys, account, notifications
  App.jsx            # Auth gate + routing
  index.css          # Design system (CSS custom properties)
server/
  production.js      # Minimal Node.js static file server for Railway
supabase/
  migrations/        # Postgres schema + RLS policies
railway.json         # Railway config-as-code
.env.example         # Required env vars (no real values)
```

---

## Design

Premium dark theme — `#080808` backgrounds, white typography, 7% white borders, radial card glows, `cubic-bezier(0.4,0,0.2,1)` easing throughout. Zero CSS framework; every component is hand-written CSS custom properties.

---

## Security

- **No secrets in source code.** All credentials are environment variables. See `.env.example`.
- **Supabase publishable key** is safe for browser use by design — it identifies your project but cannot bypass RLS.
- **Row-Level Security** is enforced on all tables: every policy uses `auth.uid()`. Users cannot read each other's data.
- **Never commit** `.env.local` or any file containing real credentials.
- If you accidentally commit a secret, rotate it immediately in the Supabase dashboard before rewriting history.
