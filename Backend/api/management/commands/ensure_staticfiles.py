from pathlib import Path

from django.core.management.base import BaseCommand

from syndicate_backend.staticfiles_bootstrap import admin_css_path, ensure_staticfiles


class Command(BaseCommand):
    help = "Collect static files and verify Django admin CSS exists under STATIC_ROOT."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Pass --clear to collectstatic (only when admin static is missing unless forced).",
        )

    def handle(self, *args, **options):
        from django.conf import settings

        path = ensure_staticfiles(clear=bool(options["clear"]), verbosity=int(options["verbosity"]))
        self.stdout.write(self.style.SUCCESS(f"staticfiles OK: {admin_css_path(Path(settings.STATIC_ROOT))}"))
        self.stdout.write(str(path))
