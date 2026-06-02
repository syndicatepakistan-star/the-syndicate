# R2 video playback — slow load / black player (0:00)

Use this when you linked an object via **rclone + admin `bucket_video_url_or_key`**, the Programs page shows the course, but the player stays **black at 0:00**, feels very heavy, or never starts.

## How playback works

1. Frontend calls `GET /api/streaming/videos/stream/<id>/` (must be signed in + entitled).
2. Backend returns `playback_url` (signed Django proxy **or** short-lived R2 presigned URL).
3. `<video src="...">` loads MP4 with HTTP **Range** requests.

The browser never uses the raw R2 URL you pasted in admin. Admin only stores the **object key** on `StreamVideo.original_video`.

## Most common causes

### 1. Django proxy mode (default) + large MP4

With `STREAM_PLAYBACK_USE_S3_PRESIGNED_GET=false`, every byte is streamed **Railway → R2 → Railway → browser**. Large files (100MB+) feel slow, time out, or stall at `0:00`.

**Fix (production, recommended for rclone uploads):**

1. Railway → Backend variables:

```env
STREAM_PLAYBACK_USE_S3_PRESIGNED_GET=true
```

2. Cloudflare R2 → your bucket → **Settings → CORS** (replace with your real frontend URL):

```json
[
  {
    "AllowedOrigins": [
      "https://YOUR-FRONTEND.up.railway.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

3. Redeploy backend. Hard-refresh the Programs page.

### 2. MP4 not “fast start” (moov atom at end of file)

If metadata is at the **end** of the file, the player must fetch the tail before play starts — painful through a proxy.

**Fix before or after rclone upload:**

```bash
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4
rclone copy output.mp4 r2:your-bucket/path/to/video.mp4
```

Use **H.264 + AAC** in an `.mp4` container for widest browser support (avoid HEVC-only files).

### 3. Wrong object key or bucket

Admin key must match the object in `AWS_STORAGE_BUCKET_NAME` exactly (e.g. `courses/flutter/lesson-15.mp4`, not a full `https://` URL unless the parser accepts it).

**Check:** Django admin → Stream video → **Resolved storage key**. Same bucket as `rclone` remote.

If the key is wrong, playback API may still return `ready` but the proxy returns **404** (black player).

Optional (admin save hangs on HEAD only):

```env
STREAM_ADMIN_SKIP_BUCKET_HEAD_CHECK=true
```

### 4. Video row not ready / not on Programs

- `status` = **ready**
- `show_in_programs` = **checked**
- Playlist linked and visible on Programs

### 5. No purchase / entitlement (403 on stream API)

Paid playlists (e.g. `$70`) require a **completed purchase** (or King tier rules). If `GET .../videos/stream/<id>/` returns **403**, the UI may still list the course but playback will fail.

Sign in as the buyer account and confirm purchase in admin or billing history.

## Quick diagnosis (browser DevTools → Network)

| Request | Good | Bad |
|--------|------|-----|
| `/api/streaming/videos/stream/<id>/` | 200, `status: "ready"`, `playback_url` set | 401/403 = auth/entitlement; 503 = storage config |
| `playback_url` (proxy or R2) | **206** Partial Content, `video/mp4` | 404 = wrong key; pending forever = proxy timeout / huge file |
| Response size on first video request | Small ranges (KB–MB) | Hundreds of MB on first hit = proxy pulling whole file |

## Railway variables checklist

```env
USE_S3_OBJECT_STORAGE=true
AWS_STORAGE_BUCKET_NAME=<same bucket as rclone>
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_S3_REGION_NAME=auto
STREAM_SIGNING_SECRET=<long random>
STREAM_PLAYBACK_USE_S3_PRESIGNED_GET=true
```

Frontend (build-time):

```env
NEXT_PUBLIC_SYNDICATE_API_URL=https://YOUR-API.up.railway.app/api
```

## Local testing

Same rules apply: large files through `127.0.0.1:8000` proxy are slow. For local dev with R2, either enable presigned + CORS with `http://localhost:3000`, or test with a small faststart MP4 (&lt; 50MB).
