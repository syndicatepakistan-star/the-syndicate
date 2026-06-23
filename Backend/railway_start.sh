#!/bin/sh
set -eu

cd "$(dirname "$0")"
PORT="${PORT:-8080}"
MODE="${1:-start}"
GUNICORN_TIMEOUT="${GUNICORN_TIMEOUT:-1800}"
# Small Railway plans OOM easily with multiple workers + FFmpeg; override if you have more RAM.
GUNICORN_WORKERS="${GUNICORN_WORKERS:-1}"
GUNICORN_THREADS="${GUNICORN_THREADS:-2}"

# Nixpacks uses /opt/venv; bare `pip` vs `python` can target different installs on Railway.
PYTHON="python"
if [ -x /opt/venv/bin/python ]; then
  PYTHON=/opt/venv/bin/python
fi

run_bootstrap_tasks() {
  mkdir -p staticfiles

  echo "railway_start: migrate"
  "$PYTHON" manage.py migrate --noinput --verbosity 1

  echo "railway_start: repair_streamvideo_original_video_column"
  "$PYTHON" manage.py repair_streamvideo_original_video_column

  echo "railway_start: ensure_staticfiles"
  CLEAR_FLAG=""
  if [ "${COLLECTSTATIC_CLEAR:-false}" = "true" ]; then
    CLEAR_FLAG="--clear"
  fi
  "$PYTHON" manage.py ensure_staticfiles ${CLEAR_FLAG} --verbosity 1
  echo "railway_start: staticfiles OK (admin/css/base.css present)"

  if [ "${AUTO_LOAD_STREAM_FIXTURE:-false}" = "true" ] && [ -f "fixtures/stream_playlist_backup.json" ]; then
    echo "railway_start: load_stream_playlists (skips automatically if catalog already exists)"
    "$PYTHON" manage.py load_stream_playlists || true
  fi

  if [ "${AUTO_SYNC_BUCKET_ASSETS:-false}" = "true" ]; then
    echo "railway_start: sync_bucket_assets (media + public)"
    "$PYTHON" manage.py sync_bucket_assets --include-media --include-public
  fi

  if [ "${AUTO_ENSURE_VAULT_PLAYLIST_STUBS:-true}" = "true" ]; then
    echo "railway_start: seed_vault_playlists"
    "$PYTHON" manage.py seed_vault_playlists --publish || true
    echo "railway_start: ensure_vault_playlist_stubs"
    "$PYTHON" manage.py ensure_vault_playlist_stubs --publish || true
  fi
}

maybe_pip_install() {
  # Nixpacks already installs requirements at build time; skip on start unless forced.
  if [ "${RAILWAY_START_PIP_INSTALL:-false}" = "true" ]; then
    echo "railway_start: installing requirements ($PYTHON)"
    "$PYTHON" -m pip install -r requirements.txt -q
  fi
}

if [ -z "${DATABASE_URL:-}" ] && [ -z "${DATABASE_PRIVATE_URL:-}" ] && [ -z "${DATABASE_PUBLIC_URL:-}" ] && [ -z "${PGHOST:-}" ]; then
  echo "railway_start: WARNING: no Postgres env; Django may use SQLite for migrate."
fi

if [ "${MODE}" = "--release" ]; then
  maybe_pip_install
  run_bootstrap_tasks
  echo "railway_start: ensure_superuser"
  "$PYTHON" manage.py ensure_superuser
  echo "railway_start: release mode complete"
  exit 0
fi

# Start mode: release DB tasks may run separately; always verify static files exist
# before gunicorn --preload (WhiteNoise indexes STATIC_ROOT at worker import).
export SKIP_WSGI_MIGRATE=true
export SKIP_WSGI_COLLECTSTATIC=true

echo "railway_start: ensure_staticfiles (before gunicorn)"
"$PYTHON" manage.py ensure_staticfiles --verbosity 1

if [ "${RAILWAY_FORCE_START_BOOTSTRAP:-false}" = "true" ]; then
  maybe_pip_install
  run_bootstrap_tasks
  echo "railway_start: ensure_superuser"
  "$PYTHON" manage.py ensure_superuser
fi

echo "railway_start: gunicorn"
exec "$PYTHON" -m gunicorn syndicate_backend.wsgi:application \
  --bind "0.0.0.0:${PORT}" \
  --workers "${GUNICORN_WORKERS}" \
  --threads "${GUNICORN_THREADS}" \
  --timeout "${GUNICORN_TIMEOUT}" \
  --preload
