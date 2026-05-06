#!/bin/sh
set -eu

cd "$(dirname "$0")"
PORT="${PORT:-8080}"
MODE="${1:-start}"

run_bootstrap_tasks() {
  mkdir -p staticfiles

  echo "railway_start: migrate"
  python manage.py migrate --noinput --verbosity 1

  echo "railway_start: collectstatic (clear + rebuild)"
  python manage.py collectstatic --noinput --clear

  if [ "${AUTO_LOAD_STREAM_FIXTURE:-false}" = "true" ] && [ -f "fixtures/stream_playlist_backup.json" ]; then
    PLAYLIST_COUNT="$(python manage.py shell -c "from apps.video_streaming.models import StreamPlaylist; print(StreamPlaylist.objects.count())" 2>/dev/null | tail -n 1 | tr -d '\r' || echo "0")"
    if [ "${PLAYLIST_COUNT}" = "0" ]; then
      echo "railway_start: loaddata fixtures/stream_playlist_backup.json (initial bootstrap)"
      python manage.py loaddata fixtures/stream_playlist_backup.json || true
    else
      echo "railway_start: skip loaddata (playlists already exist; keeping admin-edited covers/thumbnails as-is)"
    fi
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
  --workers 2 \
  --threads 4 \
  --timeout 300 \
  --preload
