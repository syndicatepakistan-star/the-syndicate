from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from apps.membership.keyword_dataset import parse_keyword_csv_bytes
from apps.membership.models import ArticleKeywordDataset

DEFAULT_DATASET_NAME = "Default membership keywords (15 seeds)"
DEFAULT_CSV = "membership_default_keywords.csv"


class Command(BaseCommand):
    help = (
        "Load the bundled 15-row keyword CSV into ArticleKeywordDataset and mark it active "
        "(skips if an active dataset with rows already exists)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Create/update the default dataset even when another active dataset exists.",
        )
        parser.add_argument(
            "--name",
            default=DEFAULT_DATASET_NAME,
            help="Dataset display name in Django admin.",
        )

    def handle(self, *args, **options):
        force = bool(options["force"])
        name = str(options["name"] or DEFAULT_DATASET_NAME).strip()

        existing = (
            ArticleKeywordDataset.objects.filter(is_active=True)
            .exclude(rows=[])
            .order_by("-created_at", "-id")
            .first()
        )
        if existing and not force:
            self.stdout.write(
                self.style.WARNING(
                    f"Active dataset already exists: “{existing.name}” ({len(existing.rows or [])} rows). "
                    "Use --force to load the bundled default anyway."
                )
            )
            return

        csv_path = Path(settings.SYNDICATE_DATA_DIR) / DEFAULT_CSV
        if not csv_path.is_file():
            self.stderr.write(self.style.ERROR(f"Missing bundled CSV: {csv_path}"))
            return

        raw = csv_path.read_bytes()
        rows = parse_keyword_csv_bytes(raw)
        if not rows:
            self.stderr.write(self.style.ERROR("Bundled CSV parsed to zero rows."))
            return

        ds, created = ArticleKeywordDataset.objects.get_or_create(
            name=name,
            defaults={"is_active": False},
        )
        with csv_path.open("rb") as fh:
            ds.csv_file.save(csv_path.name, File(fh), save=False)
        ds.rows = rows
        ds.is_active = True
        ds.save()
        ArticleKeywordDataset.objects.exclude(pk=ds.pk).update(is_active=False)

        verb = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} active keyword dataset “{ds.name}” with {len(rows)} seeds (id={ds.pk})."
            )
        )
