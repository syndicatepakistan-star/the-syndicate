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

## HLS playback (m3u8 + segments)

Admin can link either a single MP4 **or** an HLS package per Stream video.

### Admin examples

| Format | Paste in **R2 bucket URL or object key** | R2 layout |
|--------|------------------------------------------|-----------|
| MP4 | `test/lesson.mp4` | One object |
| HLS | `test/my-video/index.m3u8` | `index.m3u8` + `segment_000.ts` … in the **same folder prefix** |

On save, Django stores the key on `original_video.name`, sets `playback_kind` to `mp4` or `hls`, and validates the manifest + first segment exist.

### How HLS playback works

1. `GET /api/streaming/videos/stream/<id>/` returns `playback_type: "hls"` and `playback_url` pointing at the signed manifest proxy.
2. The proxy rewrites segment URIs in the m3u8 to signed same-origin URLs under `/api/streaming/videos/playback/<id>/media/<segment>.ts`.
3. Frontend uses **hls.js** (not native `<video src>` alone) for HLS; MP4 rows are unchanged.

HLS always uses the Django proxy (presigned direct R2 is disabled for manifests/segments so segment auth stays consistent).

### HLS CORS

HLS is proxied through the API, so R2 CORS is **not** required for segment fetches when using proxy mode. If you later serve segments directly from R2, add your origins:

```json
"AllowedOrigins": [
  "https://the-syndicate.com",
  "https://YOUR-FRONTEND.up.railway.app",
  "http://localhost:3000"
]
```

### HLS diagnosis

| Symptom | Likely cause |
|--------|----------------|
| Admin save fails on m3u8 | Manifest or first segment missing in bucket; wrong key |
| Stream API `playback_type: "hls"` but player errors | Token expired — refresh; check Network for 404 on `/media/segment_*.ts` |
| MP4 still works, HLS does not | Folder layout: segments must live beside `index.m3u8` (relative paths in playlist) |
