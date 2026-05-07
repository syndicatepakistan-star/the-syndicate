# Video streaming (HLS): admin, `.env`, and local usage

This feature transcodes admin-uploaded videos to **HLS** (FFmpeg in **Celery**), optionally uploads segments to **Cloudflare R2** (S3-compatible API), and exposes **`/api/streaming/videos/`** plus an optional Next.js UI.

### Authentication and playback (secure delivery)

- **List, detail, stream-info, and every HLS file** (`/api/streaming/videos/hls/<id>/...`) require a logged-in user: **JWT** (`Authorization: Bearer …` from portal login) or **DRF token** (`Token …` from syndicate auth), same as the rest of the dashboard.
- The API returns a **site-relative** playlist path (e.g. `/api/streaming/videos/hls/1/index.m3u8`). The Next.js app proxies that to Django; **hls.js** sends the same `Authorization` header on **each segment** request so anonymous users cannot fetch `.m3u8` / `.ts` without a token.
- **Limitations:** This is not Hollywood DRM (screen recording and advanced ripping are still possible). **Safari native HLS** cannot attach custom headers; use **Chrome / Edge / Firefox** for protected streams, or host the dashboard and API on the same site and use session cookies (not implemented here). **Public CDN URLs** stored in admin as `hls_path` are for your reference; clients use the **authenticated proxy**, not the raw CDN link, for playback.

### Screen recording, “black screen” capture, and downloads

- **Web reality:** A normal **`<video>`** element (including **hls.js**) decodes frames in the browser. There is **no supported web API** that reliably detects screen recording or forces a **black image** in the recorder. Some **DRM** stacks (e.g. **Widevine** / **FairPlay** with **HDCP** and output policies) can **reduce** leakage on **some** devices and OS versions; that requires a **license server**, **encrypted** DASH or HLS, and usually a vendor (**Cloudflare Stream**, **Mux**, **AWS MediaPackage**, **Azure Media Services**, etc.), not this repo alone.
- **What this project does:** Authenticated segment URLs, optional **UI friction** (no default download control, no PiP, no Chromecast remote playback hook), **right-click disabled** on the player, and a **forensic overlay** (viewer email/username · id) in the dashboard player to deter casual redistribution.
- **Signed URLs implemented:** `/api/streaming/videos/stream/<id>/` now returns a short-lived URL like `/api/streaming/videos/hls/<id>/index.m3u8?token=...&expires=...`. The backend validates `token` and `expires` on **every HLS request** and rewrites the playlist so segment/key URIs also include those query params (protects `*.ts` and key files with the same token system).
- **Stronger options:** Per-user **watermarks burned in** at transcode time (FFmpeg overlay with user id), **shorter-lived signed URLs** for playlists/keys, **geo / device limits**, and **legal** terms. For the strongest control, plan on **commercial DRM** end-to-end.

---

## Where to put environment variables

Create or edit **`.env`** in your **Django project root** (the folder that contains `manage.py`, e.g. `Backend/.env`).

- Django loads it via `python-dotenv` in `syndicate_backend/settings.py` (see `load_dotenv`).
- **Do not commit** `.env` to git; use **`.env.example`** as a template and copy values you need.

The streaming-related keys are also listed in **`Backend/.env.example`** under the comment `# --- HLS streaming (Celery + FFmpeg + R2) ---`.

---

## Using the Django Admin

### Before you open the admin

1. Install dependencies: `pip install -r requirements.txt` (includes **`imageio-ffmpeg`** for FFmpeg; no separate FFmpeg install required).
2. Run migrations: `python manage.py migrate`
3. Create a staff user if needed: `python manage.py createsuperuser`
4. Start the server: `python manage.py runserver`
5. **Background processing:** either  
   - run a Celery worker: `celery -A syndicate_backend worker -l info`, **or**  
   - set `CELERY_TASK_ALWAYS_EAGER=true` in `.env` so transcoding runs inside the web process (fine for quick local tests only).

### Open admin

1. Go to **`http://127.0.0.1:8000/admin/`** (or your deployed `/admin/` URL).
2. Log in with your superuser (or staff with access to **Stream videos**).

### Add or edit a stream video

1. In the admin index, find the section **“Video streaming (HLS)”** (or similar label for the `video_streaming` app).
2. Click **Stream videos** → **Add stream video** (or open an existing row).

### Fields you fill in

| Field | What to enter |
|--------|----------------|
| **Title** | Display name for the asset. |
| **Description** | Optional text (shown in API / frontend if you use it). |
| **Price** | Decimal (e.g. `0.00` for free, or `9.99`). |
| **Thumbnail** | Optional image (JPEG/PNG) for listings. |
| **Original video** | **Required for transcoding:** upload the source file (typically **MP4**). This file is **not** exposed by the public API; only the generated HLS playlist URL is returned when ready. |

**Read-only / pipeline fields** (set automatically by the system):

- **Status:** `processing` → `ready` or `failed`
- **Hls path:** public `index.m3u8` URL after success
- **Last error:** message if FFmpeg/upload failed
- **Created at:** timestamp

### What happens when you click **Save**

1. Django saves the row and stores the uploaded file under `MEDIA_ROOT` (or your configured storage).
2. A **`post_save` signal** enqueues the Celery task **`process_stream_video_to_hls`** (unless you use eager mode, where it runs immediately in-process).
3. The worker runs FFmpeg, writes HLS under `media/hls/<id>/`, optionally uploads to R2, then updates **status** and **hls path**.
4. Refresh the change form in admin to see **Ready** and the playlist URL, or check **Last error** if something failed.

### After it is ready

- **API:** `GET /api/streaming/videos/` (list), `GET /api/streaming/videos/<id>/`, `GET /api/streaming/videos/stream/<id>/`
- **Next.js (dev):** `http://localhost:3000/streaming/videos` and `/streaming/videos/<id>`

---

## `.env` variables for streaming (what to add and where values come from)

### Always set for a working playlist URL

| Variable | Required? | Example | Where to get it |
|----------|-------------|---------|------------------|
| **`VIDEO_CDN_PUBLIC_BASE_URL`** | **Yes** (for any environment) | Local: `http://127.0.0.1:8000` | **You choose** the public base URL that browsers will use to load the **`.m3u8`** link. It must match how users reach your API/media: same scheme, host, and port as Django when testing locally. **Production with R2/CDN:** set this to your **public CDN or custom domain** origin (e.g. `https://cdn.yourdomain.com`) that serves the bucket path `hls/<video_id>/index.m3u8`. It is **not** auto-discovered; set it explicitly. |
| **`STREAM_SIGNED_URL_TTL_SECONDS`** | Optional | `900` | Lifetime (seconds) for signed playback URLs (`token` + `expires`). |
| **`STREAM_SIGNING_SECRET`** | Optional but recommended | long random string | Secret used to sign playback tokens. If unset, Django `SECRET_KEY` is used. |
| **`DATA_UPLOAD_MAX_MB`** | Recommended for large admin uploads | `15360` | Django request body limit in MB. Set `15360` for 15GB uploads. |
| **`FFMPEG_TIMEOUT_SECONDS`** | Recommended for long videos | `21600` | Max ffmpeg runtime in seconds (default command timeout for HLS processing). |
| **`CELERY_TASK_SOFT_TIME_LIMIT`** | Recommended for long videos | `21000` | Soft task timeout (seconds) before hard kill. |
| **`CELERY_TASK_TIME_LIMIT`** | Recommended for long videos | `21600` | Hard task timeout (seconds). |

If this is missing, the transcoder raises an error when building the final URL.

### Celery / Redis (background jobs)

| Variable | Required? | Example | Where to get it |
|----------|-------------|---------|------------------|
| **`REDIS_URL`** | Recommended if you use a real worker | `redis://127.0.0.1:6379/0` | **Local:** install Redis (Docker: `docker run -p 6379:6379 redis:7-alpine`) or use a cloud Redis URL. **Railway:** add a Redis plugin and copy the **`REDIS_URL`** from the service variables. |
| **`CELERY_BROKER_URL`** | Optional | Same as `REDIS_URL` | Defaults in settings follow `REDIS_URL` if unset. Override only if you use a different broker URL. |
| **`CELERY_RESULT_BACKEND`** | Optional | Same as Redis | Optional; defaults like broker in this project. |
| **`CELERY_TASK_ALWAYS_EAGER`** | Optional | `true` | **Local only / debugging.** Runs tasks synchronously in the web process—**no** separate Celery worker. Set to `false` or omit in production. |

### FFmpeg (optional override)

| Variable | Required? | Example | Where to get it |
|----------|-------------|---------|------------------|
| **`FFMPEG_BINARY`** | No | `C:\path\to\ffmpeg.exe` | By default the **`imageio-ffmpeg`** pip package supplies a bundled binary. Set this only if you want to force a specific `ffmpeg` executable. |

### Cloudflare R2 (optional; production uploads from worker)

HLS segments are uploaded with **boto3** using the same S3-compatible settings as the rest of Django (`django-storages`). Object storage is enabled when bucket + access key + secret are present and **`USE_S3_OBJECT_STORAGE`** is not disabled.

| Variable | Required for R2 upload? | Where to get it |
|----------|-------------------------|------------------|
| **`AWS_ACCESS_KEY_ID`** | Yes | **Cloudflare Dashboard** → **R2** → **Manage R2 API Tokens** → create token with read/write on the bucket → copy **Access Key ID**. |
| **`AWS_SECRET_ACCESS_KEY`** | Yes | Shown **once** when you create the API token (same screen as above). Store in `.env` / Railway secrets. |
| **`AWS_STORAGE_BUCKET_NAME`** | Yes | **R2** → create a bucket → name is your bucket name. |
| **`AWS_S3_ENDPOINT_URL`** | Yes | **Account R2** overview: **S3 API** endpoint, shaped like `https://<account_id>.r2.cloudflarestorage.com` (copy from Cloudflare docs or bucket settings). |
| **`AWS_S3_REGION_NAME`** | Often `auto` for R2 | Cloudflare R2 commonly uses **`auto`** (this project defaults sensibly when keys are set). |
| **`USE_S3_OBJECT_STORAGE`** | Must **not** be `false` / `0` / `off` if you want S3/R2 | Omit or set to enable; setting **`USE_S3_OBJECT_STORAGE=false`** disables S3 storage for the whole app. |

**`VIDEO_CDN_PUBLIC_BASE_URL` with R2:** point this at the **public URL** where the browser can fetch `hls/<id>/index.m3u8`—usually a **Custom Domain** on the R2 bucket or a **Cloudflare CDN** in front of the bucket, **not** the private S3 API endpoint alone. Configure **CORS** on that public origin for your frontend’s origin.

### Other aliases (same app)

The codebase also accepts **`ACCESS_KEY_ID`**, **`SECRET_ACCESS_KEY`**, **`S3_BUCKET_NAME`**, **`S3_ENDPOINT_URL`** (see `syndicate_backend/settings.py`). Prefer the **`AWS_*`** names for consistency with boto3 and docs.

---

## API routes (reminder)

Course lesson progress stays at **`/api/videos/<id>/progress/`**. The HLS catalog uses a separate prefix to avoid mixing IDs:

| Method | Path |
|--------|------|
| GET | `/api/streaming/videos/` |
| GET | `/api/streaming/videos/<id>/` |
| GET | `/api/streaming/videos/stream/<id>/` |

---

## Minimal `.env` examples

### Local, no R2 (files under `media/hls/`)

```env
VIDEO_CDN_PUBLIC_BASE_URL=http://127.0.0.1:8000
REDIS_URL=redis://127.0.0.1:6379/0
```

Run: `redis` (or Docker), `runserver`, and `celery -A syndicate_backend worker -l info`.

**Or** skip Redis/worker for a smoke test:

```env
VIDEO_CDN_PUBLIC_BASE_URL=http://127.0.0.1:8000
CELERY_TASK_ALWAYS_EAGER=true
```

### Production-style (R2 + Redis)

```env
REDIS_URL=redis://:password@your-redis-host:6379/0
VIDEO_CDN_PUBLIC_BASE_URL=https://cdn.yourdomain.com
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_ENDPOINT_URL=https://xxxx.r2.cloudflarestorage.com
AWS_S3_REGION_NAME=auto
```

Do **not** set `USE_S3_OBJECT_STORAGE=false`. Align **`VIDEO_CDN_PUBLIC_BASE_URL`** with the hostname/path where `hls/<video_id>/index.m3u8` is publicly reachable.

---

## Prerequisites (short)

1. Python project with `manage.py` (this repo: **`Backend/`**).
2. **`pip install -r requirements.txt`** (includes **imageio-ffmpeg**).
3. **Redis** + Celery worker, **or** **`CELERY_TASK_ALWAYS_EAGER=true`** for local only.

---

## Local workflow (commands)

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # once
python manage.py runserver
# second terminal:
celery -A syndicate_backend worker -l info
```

Then use **Admin** as described above. Verify:

- `http://127.0.0.1:8000/api/streaming/videos/`

Next.js (optional):

```bash
cd Frontend-Dashboard
npm install
npm run dev
```

Open `http://localhost:3000/streaming/videos`.

---

## Production (Railway) sketch

1. **Web:** Gunicorn (`railway_start.sh`); optional **`Backend/Dockerfile`**.
2. **Worker:** same image, command `sh celery_worker_start.sh`.
3. Set **`REDIS_URL`**, **`VIDEO_CDN_PUBLIC_BASE_URL`**, and R2 **`AWS_*`** on **both** services.
4. Configure **CORS** on the public stream origin for your Next.js domain.

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| Stuck on **processing** | Celery worker running? Redis URL correct? **`last_error`** in admin. |
| Error about **`VIDEO_CDN_PUBLIC_BASE_URL`** | Set it in `.env` to the correct public base (local Django URL or CDN root). |
| FFmpeg errors | **`last_error`** in admin; try a short MP4; optional **`FFMPEG_BINARY`**. |
| R2 upload fails | Keys, endpoint, bucket name; **`USE_S3_OBJECT_STORAGE`** not disabled. |
| Browser cannot play HLS | **CORS** on CDN/R2; HTTPS vs HTTP; **`VIDEO_CDN_PUBLIC_BASE_URL`** must match where playlists are actually served. |

---

## Related code paths

- Admin / model / signals: `apps/video_streaming/`
- Task: `apps/video_streaming/tasks.py`
- R2 upload: `apps/video_streaming/services/r2_hls.py`
- URLs: `api/urls.py` → `streaming/`
- Celery: `syndicate_backend/celery.py`, `syndicate_backend/settings.py`
