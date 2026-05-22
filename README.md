# Syndicate

Full-stack **Syndicate** dashboard (portal, membership, gold HUD UI) plus an **AI agent** that creates daily missions, scores responses, and syncs streaks, leaderboard, and admin tasks.

This repo merges the upstream challenges stack described in [Smart AI Agent — Creates & Evaluates Challenges](https://github.com/HammadAli64/Smart-AI-Agent-That-Creates-Evaluates-Challenges) with the Syndicate portal and dashboard.

## What it does

- **Dashboard** — Programs, Syndicate mode, membership hub, affiliate portal, support, and goal-path UX (Next.js + GSAP).
- **Public homepage** — Hero, TikTok “Most Viewed” / “Most Informative” marquees, paywall snapshots, and a **3D program globe** (`DomeGallery`) fed from static course images.
- **Programs library** (`/programs`) — Stream playlists from Django admin as purchasable cards; static cover art when the API has no `cover_image`.
- **Globe → program deep links** — Clicking a globe tile opens the matching program on `/programs`, scrolls to that card, and highlights it with a subtle **red hamburger-style glow** so users can unlock from there.
- **Portal auth** — JWT at `/api/auth/login/` (used with `/api/portal-proxy/` from the Next app).
- **Syndicate missions** — DRF Token auth at `/api/syndicate-auth/login/` (signup, login, logout, me) for the missions panel; OpenAI generates and evaluates missions.
- **Progress & sync** — Authenticated users persist streaks and points; leaderboard and admin-assigned tasks are supported.
- **Affiliate tracking** — Same Django service: `/api/track/*` and `/api/affiliate/auth/*` (OTP). The Next.js app calls these via `NEXT_PUBLIC_SYNDICATE_API_URL` (or optional `NEXT_PUBLIC_AFFILIATE_API_BASE_URL` override).
- **Member OTP + Stripe** — Public onboarding UI lives in **`Frontend-Dashboard`** under **`/syndicate-otp/*`** (login, signup, verify OTP). **`/checkout`** and **`/checkout/success`** stay at the site root for Stripe return URLs. Set `NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE` if you need a different prefix.
- **Video streaming** — Playlists and lessons via the `video_streaming` app; S3-backed playback and admin upload flows in the dashboard.

## Tech stack

| Layer | Stack |
|--------|--------|
| API | Django 4.2, DRF, Simple JWT (portal) + Token auth (Syndicate) |
| AI | OpenAI (`OPENAI_MODEL`, default `gpt-4o-mini`) |
| UI | Next.js (App Router), React, Tailwind |

## Layout (one backend, one frontend)

| Folder | Role |
|--------|------|
| **`Backend/`** | Single Django project: `syndicate_backend`, `api`, `apps/challenges`, `apps/portal`, `apps/membership`, **`apps/affiliate_tracking`**, **`video_streaming`**. |
| **`Frontend-Dashboard/`** | Next.js app: marketing homepage, dashboard, portal proxy, streaming UI, programs library, and member OTP + Stripe flow. |

The old **`affiliate-portal/`** split (separate Next + Django) has been removed; behavior lives in **`Backend/`** + **`Frontend-Dashboard/`**.

## Homepage globe & programs library

### Globe images

Program tiles on the homepage globe are loaded from:

`Frontend-Dashboard/public/assets/programs/cources imnages/`

Any image file in that folder (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.avif`) is picked up automatically for the globe. Add or replace files there to change what appears on the sphere.

### Playlist ID → cover image

Each public program card can show a static thumbnail when Django has no `cover_image`. Mappings live in:

`Frontend-Dashboard/src/lib/programPlaylistThumbnails.ts`

- Keys are **Stream playlist primary keys** (same IDs as in Django admin / `stream_playlist_backup.json`).
- Playlist **#6** (Mastering Consistency) is hidden from the public grid.
- To wire a new program: add the image under `cources imnages/`, then add `id: courseThumb('filename.ext')` to `PROGRAM_PLAYLIST_THUMBNAILS` and the same filename to `GLOBE_FILENAME_TO_PROGRAM_ID` (built from that map).

### Deep links

| Source | URL |
|--------|-----|
| Globe click (mapped tile) | `/programs?program={id}#programs-library` |
| Legacy `/program/{id}` | Middleware redirects to the URL above (no login required) |

Related frontend modules:

| File | Purpose |
|------|---------|
| `src/lib/programGalleryLinks.ts` | Attaches `href` / `programId` to globe images |
| `src/lib/programCardScroll.ts` | Scrolls the visible card into view after navigation |
| `src/components/programs/PlaylistCardsSection.tsx` | Public program cards, unlock/checkout, red spotlight |
| `src/middleware.ts` | Public routes + `/program/:id` → `/programs` redirect |

## Backend setup

```bash
cd Backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy `Backend/env.example` to `Backend/.env`, set secrets as needed, then:

```bash
python manage.py migrate
python manage.py runserver
```

Playlist fixtures (IDs/titles only, no media): `Backend/fixtures/stream_playlist_backup.json`.

## Frontend setup

```bash
cd Frontend-Dashboard
npm install
```

Copy `Frontend-Dashboard/.env.example` to `Frontend-Dashboard/.env.local` and adjust. Use `BACKEND_INTERNAL_URL` for the portal proxy and `NEXT_PUBLIC_SYNDICATE_API_URL` for direct API calls (must end with `/api`). Affiliate features use the **same** base URL unless `NEXT_PUBLIC_AFFILIATE_API_BASE_URL` is set.

```bash
npm run dev
```

Open `http://localhost:3000` for the marketing site; `/programs` for the public library; `/dashboard` after login.

## Production hosting (Railway + R2)

Deploy with **PostgreSQL on Railway**, **private Cloudflare R2** for videos, and optional Redis:

**[Backend/docs/HOSTING_RAILWAY_R2.md](Backend/docs/HOSTING_RAILWAY_R2.md)** — full step-by-step (services, env vars, R2 setup, whether you need Redis/worker).

**[Backend/docs/RAILWAY_GIT_AUTO_DEPLOY.md](Backend/docs/RAILWAY_GIT_AUTO_DEPLOY.md)** — git push → Railway auto runs migrate, collectstatic, and loads playlists when the DB is empty.

## License

Add your license if you publish publicly.
