#!/bin/sh
# Optional Railway service: Celery worker (only needed if you add background tasks).
# Web service should run railway_start.sh; this service only runs the worker.
set -eu

cd "$(dirname "$0")"

echo "railway_worker_start: installing requirements"
pip install -r requirements.txt

echo "railway_worker_start: celery worker"
exec celery -A syndicate_backend worker -l info --concurrency="${CELERY_CONCURRENCY:-1}"
