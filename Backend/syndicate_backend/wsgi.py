"""
WSGI config for syndicate_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "syndicate_backend.settings")

import django

django.setup()

# Apply DB migrations at import so deploys work even when the shell start command is wrong.
# Use gunicorn --preload so this runs once in the master before workers fork.
def _ensure_admin_static_files() -> None:
    """Railway release/start may skip collectstatic; admin CSS 404 breaks /admin/ styling."""
    if (os.environ.get("SKIP_WSGI_COLLECTSTATIC") or "").strip().lower() in ("1", "true", "yes"):
        return
    from syndicate_backend.staticfiles_bootstrap import ensure_staticfiles

    print("syndicate_backend.wsgi: ensure_staticfiles (admin static missing)", flush=True)
    ensure_staticfiles(verbosity=1)
    print("syndicate_backend.wsgi: ensure_staticfiles finished", flush=True)


if (os.environ.get("SKIP_WSGI_MIGRATE") or "").strip().lower() not in ("1", "true", "yes"):
    from django.conf import settings
    from django.core.management import call_command

    _engine = (settings.DATABASES["default"].get("ENGINE") or "").lower()
    _is_sqlite = _engine == "django.db.backends.sqlite3"

    if not _is_sqlite:
        _db = settings.DATABASES["default"]

        print(
            "syndicate_backend.wsgi: db target "
            f"engine={_db.get('ENGINE')} name={_db.get('NAME')} host={_db.get('HOST')}",
            flush=True,
        )

        print("syndicate_backend.wsgi: running migrate on default database", flush=True)

        try:
            call_command("migrate", interactive=False, verbosity=1)
        except Exception:
            print("syndicate_backend.wsgi: migrate failed", file=sys.stderr, flush=True)
            raise

        print("syndicate_backend.wsgi: migrate finished", flush=True)

        call_command("repair_streamvideo_original_video_column", verbosity=1)

        from django.db import connection

        connection.ensure_connection()

        if (
            connection.vendor == "postgresql"
            and "auth_user" not in connection.introspection.table_names()
        ):
            raise RuntimeError(
                "PostgreSQL has no auth_user after migrate. "
                "Fix DATABASE_URL on this Railway service (same DB as Postgres plugin)."
            )
    else:
        print("syndicate_backend.wsgi: skipping migrate (SQLite default)", flush=True)

    _ensure_admin_static_files()


from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
