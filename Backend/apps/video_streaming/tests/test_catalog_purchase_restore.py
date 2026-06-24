from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase
from apps.video_streaming.services.catalog_seed import (
    purge_stream_catalog,
    restore_paid_playlist_purchases,
    seed_syndicate_catalog,
    snapshot_paid_playlist_purchases,
)


class CatalogPurchaseRestoreTests(TestCase):
    def test_purge_and_seed_restores_paid_purchases_by_slug(self):
        user = User.objects.create_user(username="buyer", email="buyer@example.com", password="x")
        playlist = StreamPlaylist.objects.create(
            title="App Building Using Flutter",
            slug="level1-model-03",
            category=StreamPlaylist.Category.BUSINESS_MODEL,
            price=Decimal("14.00"),
            is_published=True,
        )
        StreamPlaylistPurchase.objects.create(
            user=user,
            playlist=playlist,
            status=StreamPlaylistPurchase.Status.PAID,
            stripe_session_id="cs_test_flutter",
            stripe_checkout_session_id="cs_test_flutter",
            amount_paid=Decimal("14.00"),
            currency="usd",
        )

        snapshots = snapshot_paid_playlist_purchases()
        self.assertEqual(len(snapshots), 1)
        self.assertEqual(snapshots[0].playlist_slug, "level1-model-03")

        purge_stream_catalog()
        self.assertEqual(StreamPlaylistPurchase.objects.count(), 0)

        stats = seed_syndicate_catalog(purge_first=False, publish=True, playlists_only=True)
        self.assertGreater(stats.level1_playlists, 0)

        restored = restore_paid_playlist_purchases(snapshots)
        self.assertEqual(restored, 1)

        new_playlist = StreamPlaylist.objects.get(slug="level1-model-03")
        purchase = StreamPlaylistPurchase.objects.get(user=user, playlist=new_playlist)
        self.assertEqual(purchase.status, StreamPlaylistPurchase.Status.PAID)
        self.assertEqual(purchase.amount_paid, Decimal("14.00"))
        self.assertEqual(purchase.stripe_checkout_session_id, "cs_test_flutter")

    def test_snapshot_skips_quiz_ticket_rows(self):
        user = User.objects.create_user(username="quiz", email="quiz@example.com", password="x")
        playlist = StreamPlaylist.objects.create(
            title="Zero to One Million",
            slug="level1-psych-01",
            category=StreamPlaylist.Category.BUSINESS_PSYCHOLOGY,
            price=Decimal("0.00"),
            is_published=True,
        )
        StreamPlaylistPurchase.objects.create(
            user=user,
            playlist=playlist,
            status=StreamPlaylistPurchase.Status.PAID,
            stripe_session_id="quiz_ticket_1_2",
            amount_paid=Decimal("0.00"),
            currency="usd",
        )
        self.assertEqual(len(snapshot_paid_playlist_purchases()), 0)
