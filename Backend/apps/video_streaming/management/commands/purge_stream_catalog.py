"""
Purge all stream playlists/videos (testing reset).

Usage:
  python manage.py purge_stream_catalog
  python manage.py purge_stream_catalog --include-plan-purchases
"""

from django.core.management.base import BaseCommand

from apps.portal.models import UserPlanPurchase
from apps.video_streaming.services.catalog_seed import purge_stream_catalog


class Command(BaseCommand):
    help = "Delete all StreamPlaylist / StreamVideo rows and related purchases (testing)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--include-plan-purchases",
            action="store_true",
            help="Also delete UserPlanPurchase rows (Stripe test purchases).",
        )

    def handle(self, *args, **options):
        if options["include_plan_purchases"]:
            n = UserPlanPurchase.objects.count()
            UserPlanPurchase.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {n} UserPlanPurchase rows."))

        stats = purge_stream_catalog()
        self.stdout.write(
            self.style.SUCCESS(
                f"Purged stream catalog: playlists={stats.purged_playlists} videos={stats.purged_videos}"
            )
        )
