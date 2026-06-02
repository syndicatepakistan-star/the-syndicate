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
}

# Nixpacks build already installs requirements; use same Python for optional refresh.
if [ "${RAILWAY_START_PIP_INSTALL:-true}" = "true" ]; then
  echo "railway_start: installing requirements ($PYTHON)"
  "$PYTHON" -m pip install -r requirements.txt -q
fi

if [ -z "${DATABASE_URL:-}" ] && [ -z "${DATABASE_PRIVATE_URL:-}" ] && [ -z "${DATABASE_PUBLIC_URL:-}" ] && [ -z "${PGHOST:-}" ]; then
  echo "railway_start: WARNING: no Postgres env; Django may use SQLite for migrate."
fi

run_bootstrap_tasks

if [ "${MODE}" = "--release" ]; then
  echo "railway_start: release mode complete"
  exit 0
fi

echo "railway_start: ensure_superuser"
"$PYTHON" manage.py ensure_superuser

echo "railway_start: gunicorn"
exec "$PYTHON" -m gunicorn syndicate_backend.wsgi:application \
  --bind "0.0.0.0:${PORT}" \
  --workers "${GUNICORN_WORKERS}" \
  --threads "${GUNICORN_THREADS}" \
  --timeout "${GUNICORN_TIMEOUT}" \
  --preload
