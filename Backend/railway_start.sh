#!/bin/sh
set -eu

cd "$(dirname "$0")"
PORT="${PORT:-8080}"
MODE="${1:-start}"
GUNICORN_TIMEOUT="${GUNICORN_TIMEOUT:-1800}"
# Small Railway plans OOM easily with multiple workers + FFmpeg; override if you have more RAM.
GUNICORN_WORKERS="${GUNICORN_WORKERS:-1}"
GUNICORN_THREADS="${GUNICORN_THREADS:-2}"

run_bootstrap_tasks() {
  mkdir -p staticfiles

  echo "railway_start: migrate"
  python manage.py migrate --noinput --verbosity 1

  echo "railway_start: collectstatic"
  if [ "${COLLECTSTATIC_CLEAR:-false}" = "true" ]; then
    python manage.py collectstatic --noinput --clear
  else
    python manage.py collectstatic --noinput
  fi
  if [ ! -f "staticfiles/admin/css/base.css" ]; then
    echo "railway_start: ERROR admin static missing after collectstatic"
    exit 1
  fi
  echo "railway_start: staticfiles OK (admin/css/base.css present)"

  if [ "${AUTO_LOAD_STREAM_FIXTURE:-false}" = "true" ] && [ -f "fixtures/stream_playlist_backup.json" ]; then
    echo "railway_start: load_stream_playlists (skips automatically if catalog already exists)"
    python manage.py load_stream_playlists || true
  fi

  if [ "${AUTO_SYNC_BUCKET_ASSETS:-false}" = "true" ]; then
    echo "railway_start: sync_bucket_assets (media + public)"
    python manage.py sync_bucket_assets --include-media --include-public
  fi
}

echo "railway_start: installing requirements"
pip install -r requirements.txt

if [ -z "${DATABASE_URL:-}" ] && [ -z "${DATABASE_PRIVATE_URL:-}" ] && [ -z "${DATABASE_PUBLIC_URL:-}" ] && [ -z "${PGHOST:-}" ]; then
  echo "railway_start: WARNING: no Postgres env; Django may use SQLite for migrate."
fi

run_bootstrap_tasks

if [ "${MODE}" = "--release" ]; then
  echo "railway_start: release mode complete"
  exit 0
fi

echo "railway_start: ensure_superuser"
python manage.py ensure_superuser

echo "railway_start: gunicorn"
exec python -m gunicorn syndicate_backend.wsgi:application \
  --bind "0.0.0.0:${PORT}" \
  --workers "${GUNICORN_WORKERS}" \
  --threads "${GUNICORN_THREADS}" \
  --timeout "${GUNICORN_TIMEOUT}" \
  --preload
