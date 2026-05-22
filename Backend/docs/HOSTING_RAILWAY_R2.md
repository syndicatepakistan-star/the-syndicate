# Host on Railway with PostgreSQL + private Cloudflare R2

Step-by-step guide for this repo: **Django API** + **Next.js frontend** on Railway, **PostgreSQL** for data, **private R2** for member videos.

---

## Do you need Redis and a Celery worker?

| Service | Required? | Why |
|---------|-----------|-----|
| **PostgreSQL** | **Yes** | Users, playlists, Stripe, enrollments, missions. |
| **R2 (private)** | **Yes** (production) | Uploaded MP4s and files; bucket must stay private. |
| **Redis** | **Optional** | Speeds up membership article search. App works without it (falls back to DB). |
| **Celery worker** | **Optional** | This codebase plays **MP4 from R2** via signed API URLs. There are **no Celery transcode tasks** in the repo right now, so a worker does nothing unless you add background jobs later. |

**Minimum production stack:** PostgreSQL + Backend web + Frontend web + R2 credentials.

**Recommended:** add Redis if you use membership article search.

---

## Part 1 — Cloudflare R2 (private videos)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Create bucket**.
2. Name it (e.g. `syndicate-videos`). Leave **public access disabled** (private bucket).
3. **R2** → **Manage R2 API Tokens** → **Create API token**:
   - Permission: **Object Read & Write**
   - Scope: your bucket only
   - Copy **Access Key ID** and **Secret Access Key** (secret shown once).
4. **R2** → **Overview** → copy **S3 API** endpoint:  
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

### Playback modes (pick one)

| `STREAM_PLAYBACK_USE_S3_PRESIGNED_GET` | Behavior |
|----------------------------------------|----------|
| `false` (**recommended**) | Browser hits your **Railway backend**; Django streams bytes from private R2. Bucket URL never appears in DevTools. No R2 CORS setup. |
| `true` | Browser gets a short-lived presigned R2 URL (smoother for very long MP4s). You must add **CORS** on the bucket allowing `GET` from your frontend origin. |

---

## Part 2 — Railway project

Create one Railway project and add these services.

### 1. PostgreSQL

1. **New** → **Database** → **PostgreSQL**.
2. Railway injects `DATABASE_URL` into linked services automatically when you use **Variables** reference (or copy from Postgres service → **Connect**).

### 2. Redis (optional)

1. **New** → **Database** → **Redis**.
2. Copy `REDIS_URL` into the backend service variables (see below).

### 3. Backend (Django API)

1. **New** → **GitHub Repo** (or deploy from this folder).
2. **Settings** → **Root Directory**: `Backend` (capital B — must match repo folder).
3. **Settings** → **Start Command**: leave empty (uses `railway_start.sh` from `nixpacks.toml` / `railway.toml`).
4. **Settings** → generate a public domain (e.g. `syndicate-api.up.railway.app`).
5. Link **PostgreSQL** (and Redis if added): use Railway **variable references** so `DATABASE_URL` / `REDIS_URL` flow in.

#### Backend variables (copy into Railway → Variables)

Replace placeholders with your real values.

```env
DJANGO_SECRET_KEY=<long-random-string>
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=syndicate-api.up.railway.app
RAILWAY_PUBLIC_DOMAIN=syndicate-api.up.railway.app
CSRF_TRUSTED_ORIGINS=https://syndicate-frontend.up.railway.app,https://syndicate-api.up.railway.app
CORS_ALLOWED_ORIGINS=https://syndicate-frontend.up.railway.app

FRONTEND_BASE_URL=https://syndicate-frontend.up.railway.app
POST_LOGIN_REDIRECT_URL=https://syndicate-frontend.up.railway.app/dashboard

# Postgres — usually auto from plugin:
DATABASE_SSL_REQUIRE=true

# Private Cloudflare R2
USE_S3_OBJECT_STORAGE=true
AWS_STORAGE_BUCKET_NAME=syndicate-videos
AWS_ACCESS_KEY_ID=<r2-access-key-id>
AWS_SECRET_ACCESS_KEY=<r2-secret>
AWS_S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_S3_REGION_NAME=auto
MEDIA_SIGNED_URLS=true

# Streaming (private bucket + signed playback)
VIDEO_CDN_PUBLIC_BASE_URL=https://syndicate-api.up.railway.app
STREAM_SIGNING_SECRET=<another-long-random-string>
STREAM_SIGNED_URL_TTL_SECONDS=900
STREAM_PLAYBACK_USE_S3_PRESIGNED_GET=false

# Large admin uploads
DATA_UPLOAD_MAX_MB=15360
FILE_UPLOAD_MAX_MEMORY_MB=8
GUNICORN_TIMEOUT=1800

# Optional admin (first deploy)
DJANGO_SUPERUSER_EMAIL=you@domain.com
DJANGO_SUPERUSER_PASSWORD=<strong-password>

# Optional Redis (membership search)
REDIS_URL=<from Redis plugin>

# Do not overwrite admin playlists on every deploy
AUTO_LOAD_STREAM_FIXTURE=false
AUTO_SYNC_BUCKET_ASSETS=false

# Stripe / OpenAI / email — add your production keys as needed
```

Also set: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, email vars — see `Backend/env.example`.

### 4. Frontend (Next.js)

1. **New** service, same repo.
2. **Root Directory**: `Frontend-Dashboard`
3. Uses **Dockerfile** build (`Frontend-Dashboard/railway.toml`).
4. Public domain: e.g. `syndicate-frontend.up.railway.app`

```env
NEXT_PUBLIC_AUTH_REQUIRED=true
NEXT_PUBLIC_API_BASE_URL=https://syndicate-api.up.railway.app
NEXT_PUBLIC_SYNDICATE_API_URL=https://syndicate-api.up.railway.app/api
BACKEND_INTERNAL_URL=https://syndicate-api.up.railway.app
SYNDICATE_DJANGO_ORIGIN=https://syndicate-api.up.railway.app
NEXT_PUBLIC_POST_LOGIN_REDIRECT_URL=https://syndicate-frontend.up.railway.app/dashboard
NEXT_PUBLIC_SITE_URL=https://syndicate-frontend.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Redeploy **backend** after you know the frontend URL (update `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`).

### 5. Celery worker (optional — only if you add background tasks)

Only create this if you introduce Celery tasks (e.g. future HLS transcoding).

1. Duplicate backend service or **New** from same repo, **Root Directory** `Backend`.
2. **Start Command**:

```bash
sh railway_worker_start.sh
```

3. Copy **all** backend env vars (same `DATABASE_URL`, R2 keys, etc.).
4. Do **not** expose a public domain on the worker.

---

## Part 3 — Deploy and verify

### Manual upload (R2 dashboard → admin URL/key)

1. In **Cloudflare R2**, upload your MP4 to the private bucket (note the **object key**, e.g. `programs/lesson-1.mp4`).
2. Django admin → **Stream videos** → Add (or edit).
3. In **R2 bucket URL or object key**, paste either:
   - the **object key** only: `programs/lesson-1.mp4`, or
   - the full R2 URL: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<bucket>/programs/lesson-1.mp4`
4. Click **Save**. Status should show **Ready**; **Resolved storage key** shows the key used for playback.
5. Members still play via signed API URLs — the raw R2 link is not shown in the dashboard player.

You do **not** need to fill **Original video** if you use the bucket URL/key field.

### Backend

1. Deploy backend; check **Deploy Logs** for:
   - `railway_start: migrate`
   - `railway_start: collectstatic`
   - Gunicorn listening on `$PORT`
2. Open `https://<backend-domain>/admin/` and log in.
3. Upload a test **Stream video** (MP4) in admin → status should become **ready**.

### Frontend

1. Deploy frontend.
2. Open site → login → **Programs** → play a video.
3. In browser **Network** tab, playback should go to  
   `https://<backend>/api/streaming/videos/playback/<id>/?token=...`  
   (not a public R2 URL if `STREAM_PLAYBACK_USE_S3_PRESIGNED_GET=false`).

### API smoke test

```text
GET https://<backend>/api/streaming/playlists/
```

Expect `401` (no auth) or `200` (with token) — not `500`.

---

## Part 4 — Cloudinary (optional, recommended for images)

Thumbnails and playlist covers can use **Cloudinary** (public CDN) while **videos stay private on R2**.

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

See `Backend/env.example` for aliases.

---

## Architecture

```text
User → Next.js (Railway) → Django API (Railway) → PostgreSQL
                              ↓
                         Private R2 (MP4 / files)
                              ↑
                    Optional Redis (search cache)
```

Videos are **never** served as a permanent public R2 link. The API checks login + purchase/enrollment, then issues a **short-lived signed playback URL** (or proxies bytes from R2).

---

## Common issues

| Problem | Fix |
|---------|-----|
| `Cannot reach API` on frontend | Wrong `NEXT_PUBLIC_API_BASE_URL`; backend down or CORS missing frontend URL. |
| Upload works locally, fails on Railway | Set all `AWS_*` R2 vars; `USE_S3_OBJECT_STORAGE=true`; check token permissions. |
| Video won't play | User not entitled; token expired — refresh player; check `STREAM_SIGNING_SECRET` is set and stable across deploys. |
| R2 403 on upload | Token needs **Write**; endpoint must include `https://` and correct account id. |
| OOM on large upload | Raise Railway RAM or lower `GUNICORN_WORKERS=1`; use `FILE_UPLOAD_MAX_MEMORY_MB=8`. |
| Membership search slow | Add Redis and `REDIS_URL`. |

---

## Quick reference

- Env template: `Backend/env.example`
- Railway release/start: `Backend/railway_start.sh`, `Backend/railway.toml`
- Optional worker: `Backend/railway_worker_start.sh`
- Older notes: `Backend/docs/RAILWAY_DEPLOYMENT.md`, `Backend/docs/VIDEO_STREAMING.md`
