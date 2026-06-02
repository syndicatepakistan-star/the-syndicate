from django.core.management.base import BaseCommand

from apps.membership.generation import _parse_seed_from_content
from apps.membership.json_tags import filter_articles_with_tag
from apps.membership.models import Article


class Command(BaseCommand):
    help = (
        "Copy Seed: keyword - category from article content into generation_seed_* fields "
        "(older articles may only have the seed in content)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many rows would be updated without saving.",
        )

    def handle(self, *args, **options):
        dry = bool(options["dry_run"])
        updated = 0
        scanned = 0
        qs = filter_articles_with_tag(Article.objects.all(), "operator-brief").only(
            "id",
            "content",
            "generation_seed_keyword",
            "generation_seed_category",
            "generation_seed_level",
        )
        for article in qs.iterator(chunk_size=100):
            scanned += 1
            if (article.generation_seed_keyword or "").strip():
                continue
            parsed = _parse_seed_from_content(article.content)
            if not parsed:
                continue
            kw, cat = parsed
            if dry:
                updated += 1
                continue
            article.generation_seed_keyword = kw[:500]
            article.generation_seed_category = cat
            article.save(update_fields=["generation_seed_keyword", "generation_seed_category"])
            updated += 1

        verb = "Would update" if dry else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} {updated} of {scanned} operator-brief article(s)."))
