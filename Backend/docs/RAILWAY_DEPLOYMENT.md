# Railway Deployment Guide

**Primary guide (PostgreSQL + private Cloudflare R2):** see **[HOSTING_RAILWAY_R2.md](./HOSTING_RAILWAY_R2.md)**.

This file is a shorter checklist. Stack:

- Django API (`Backend/`)
- Next.js frontend (`Frontend-Dashboard/`)
- PostgreSQL (required)
- Private **Cloudflare R2** for videos (recommended)
- Redis (optional — membership search cache)
- Celery worker (optional — no transcode tasks in repo today; MP4 plays via API + R2)

---

## 1) Create Railway services

In one Railway project, create:

1. **PostgreSQL** service (required)
2. **Redis** service (optional)
3. **Backend web** service (root directory: `Backend`)
4. **Frontend web** service (root directory: `Frontend-Dashboard`)
5. **Backend worker** service (optional — only if you add Celery background jobs)

---

## 2) Backend web service (`Backend/`)

Set **Root Directory** to `Backend`.

This repo already includes:

- `Backend/railway.toml`
- `Backend/railway_start.sh`

So start/release commands are handled automatically.

### Required backend environment variables

Set these in Railway for the backend service:

- `DJANGO_SECRET_KEY` = long random string
- `DJANGO_DEBUG` = `false`
- `DJANGO_ALLOWED_HOSTS` = your Railway backend host (comma-separated if multiple)
- `CSRF_TRUSTED_ORIGINS` = `https://<your-backend-domain>`
- `OPENAI_API_KEY` (if using missions AI features)
- `OPENAI_MODEL` (optional, default exists)

Database/Redis:

- `DATABASE_URL` (auto from PostgreSQL plugin)
- `REDIS_URL` (auto from Redis plugin)

Streaming/security (recommended):

- `VIDEO_CDN_PUBLIC_BASE_URL` = `https://<your-backend-domain>`
- `STREAM_SIGNED_URL_TTL_SECONDS` = `900` (or lower, e.g. `300`)
- `STREAM_SIGNING_SECRET` = long random string
- `AUTO_LOAD_STREAM_FIXTURE` = `false` (recommended for production so deploys do not overwrite admin-edited playlists/covers)
- For large admin uploads (e.g. 9GB+):
  - `DATA_UPLOAD_MAX_MB=15360`
  - `FILE_UPLOAD_MAX_MEMORY_MB=8` (keep RAM safe; stream large files to temp storage)
  - `GUNICORN_TIMEOUT=1800` (avoid 5-minute request timeout during long uploads)
  - `STREAM_DIRECT_UPLOAD_MAX_GB=5` (block risky direct form uploads above this; force multipart/bucket key flow)
- Memory / OOM: if logs show `Worker ... was sent SIGKILL! Perhaps out of memory?`, use a **Celery worker service** for HLS (never rely on FFmpeg inside Gunicorn), keep `DJANGO_DEBUG=false`, and optionally raise Railway RAM or set `GUNICORN_WORKERS=1` / `GUNICORN_THREADS=2` (defaults in `railway_start.sh`).

Optional (emergency / debugging only): `STREAM_SYNC_TRANSCODE_ON_PLAYBACK=true` runs HLS transcoding inside the web request when a video is still `processing` (e.g. worker was down). Prefer a healthy Celery worker; do not enable under real traffic.

Private **Cloudflare R2** (recommended for videos):

- `USE_S3_OBJECT_STORAGE` = `true`
- `AWS_STORAGE_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_ENDPOINT_URL` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `AWS_S3_REGION_NAME` = `auto`
- `MEDIA_SIGNED_URLS` = `true`
- `STREAM_PLAYBACK_USE_S3_PRESIGNED_GET` = `false` (Django proxies private R2; recommended)

Admin bootstrap (optional):

- `DJANGO_SUPERUSER_EMAIL`
- `DJANGO_SUPERUSER_PASSWORD`

### Deploy checks

After deploy, verify:

- `/admin/` loads
- `/api/streaming/playlists/` returns 401/200 (not 500)
- Railway logs show migrations applied

---

## 3) Backend worker service (Celery) — optional

**Skip this** unless you add Celery tasks. Current app marks uploaded MP4s **ready** and plays them via signed API URLs + private R2 (no HLS worker required).

If you add background jobs later, create another service with root `Backend` and Start Command:

```bash
sh railway_worker_start.sh
```

Use the same env vars as backend web (`DATABASE_URL`, R2 keys, `REDIS_URL` if used).

---

## 4) Frontend service (`Frontend-Dashboard/`)

Set Root Directory to `Frontend-Dashboard`.

### Required frontend environment variables

- `NEXT_PUBLIC_API_BASE_URL` = `https://<your-backend-domain>`
- `NEXT_PUBLIC_SYNDICATE_API_URL` = `https://<your-backend-domain>/api`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if checkout used)

Optional:

- `NEXT_PUBLIC_AFFILIATE_API_BASE_URL` (if you split affiliate API base; usually not required)

Important: if frontend cannot reach backend, you will see:

- `Cannot reach API (...) Failed to fetch`
- empty Programs/playlist blocks

So confirm `NEXT_PUBLIC_API_BASE_URL` points to the live backend URL.

---

## 5) Domain + CORS/CSRF checklist

When frontend domain is ready, add/update backend env:

- `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`
- `CSRF_TRUSTED_ORIGINS=https://<your-frontend-domain>,https://<your-backend-domain>`
- `DJANGO_ALLOWED_HOSTS=<backend-domain>`

Redeploy backend after env changes.

---

## 6) HLS and signed URL behavior in production

- Playback endpoint returns short-lived URL:
  - `/api/streaming/videos/hls/<id>/index.m3u8?token=...&expires=...`
- The backend validates token/expiry on every HLS request.
- Manifest rewriting adds the same token to segment/key URIs (`.ts`, key files).

This prevents simple long-term link sharing, but URLs are still visible in browser devtools while a user watches (normal for web playback).

---

## 7) Quick smoke test after full deploy

1. Log in from frontend.
2. Open Programs.
3. Open a playlist and play a video.
4. Confirm playlist loads and video status is `ready`.
5. In browser network tab, confirm `.m3u8` and `.ts` include `token` and `expires`.
6. Wait for token expiry and refresh playback URL to confirm renewal.

---

## 8) Common failures and fixes

- **`Cannot reach API` on frontend**
  - Wrong `NEXT_PUBLIC_API_BASE_URL` or backend not deployed.
- **`Application labels aren't unique`**
  - Duplicate app entry in `INSTALLED_APPS`.
- **`SyntaxError: unmatched '}'` in settings**
  - Invalid manual edit in `settings.py`.
- **Video stuck in `processing`**
  - Re-save in admin or re-upload; current pipeline sets **ready** on upload. Legacy HLS docs may mention Celery — not used for MP4-only flow.
- **Signed URL returns 404**
  - Token expired; refresh stream API call and retry.

