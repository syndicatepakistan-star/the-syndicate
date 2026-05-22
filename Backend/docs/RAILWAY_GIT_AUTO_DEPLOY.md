# Git push → Railway auto deploy

When your Railway project is connected to GitHub, **every `git push` to `main`** redeploys the services that watch that branch.

## One-time Railway setup

1. [Railway Dashboard](https://railway.app) → your project → **backend** service.
2. **Settings** → **Source** → connect repo `Syndicate_real1` (or your fork).
3. **Root Directory:** `Backend`
4. **Branch:** `main` (or your production branch).
5. **Custom Start Command:** leave **empty** (uses `railway.toml` / `nixpacks.toml`).
6. Link **PostgreSQL** to the backend service (Variables → `DATABASE_URL`).
7. Repeat for **frontend** service: Root Directory `Frontend-Dashboard`, same repo/branch.

Enable **Deploy on push** if it is not already on (Settings → Source).

## What runs automatically on each push (backend)

Railway runs these from `Backend/railway.toml` — you do **not** run them manually:

| Phase | Command | What it does |
|--------|---------|----------------|
| **Release** (before new containers go live) | `sh railway_start.sh --release` | `migrate`, `collectstatic`, optional `load_stream_playlists` |
| **Start** (when container runs) | `sh railway_start.sh` | same bootstrap + `ensure_superuser` + **Gunicorn** |

### Program playlists (auto)

Repo default (`Backend/nixpacks.toml`):

```toml
AUTO_LOAD_STREAM_FIXTURE = "true"
```

On deploy, `python manage.py load_stream_playlists` runs. It **only imports** `fixtures/stream_playlist_backup.json` when the database has **zero** playlists. If you already have playlists, it logs *Skipping* and does not overwrite admin edits.

To disable after first successful deploy (optional), in Railway → backend **Variables**:

```env
AUTO_LOAD_STREAM_FIXTURE=false
```

## What runs on each push (frontend)

- Docker build (`npm run build`) using `Frontend-Dashboard/Dockerfile`
- Start: `node server.js` from `Frontend-Dashboard/railway.toml`

Set on the **frontend** service (replace with your real backend host if different):

```env
BACKEND_INTERNAL_URL=https://syndicatereal1-production-ae68.up.railway.app
NEXT_PUBLIC_API_BASE_URL=https://syndicatereal1-production-ae68.up.railway.app
NEXT_PUBLIC_SYNDICATE_API_URL=https://syndicatereal1-production-ae68.up.railway.app/api
SYNDICATE_DJANGO_ORIGIN=https://syndicatereal1-production-ae68.up.railway.app
```

`BACKEND_INTERNAL_URL` is required for `/programs` playlist cards (runtime API proxy). Redeploy frontend after changing any `NEXT_PUBLIC_*` variable.

## Your workflow

```bash
git add .
git commit -m "your message"
git push origin main
```

Then in Railway → **Deployments** watch logs for:

```text
railway_start: migrate
railway_start: collectstatic
railway_start: load_stream_playlists
```

Verify playlists:

```text
GET https://YOUR-BACKEND.up.railway.app/api/streaming/public-playlists/
```

Should return a JSON array (not `[]`) after the first successful import.

## Required backend variables (still manual once)

Git push does **not** set secrets. In Railway → backend **Variables**, configure at least:

- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS` / `RAILWAY_PUBLIC_DOMAIN`
- `CORS_ALLOWED_ORIGINS` / `FRONTEND_BASE_URL`
- R2: `AWS_*` / `USE_S3_OBJECT_STORAGE`
- `DATABASE_URL` (from Postgres plugin)

See [HOSTING_RAILWAY_R2.md](./HOSTING_RAILWAY_R2.md).
