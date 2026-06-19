from django.test import TestCase

from accounts.vault_video_catalog import (
    agentic_course_rows,
    trading_r2_key_candidates,
    vault_r2_key_candidates,
)
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamVideo
from apps.video_streaming.services.vault_playlist_seed import seed_all_vault_playlists


class VaultVideoCatalogTests(TestCase):
    def test_agentic_row_count_matches_catalog(self):
        self.assertEqual(len(agentic_course_rows()), 26)

    def test_agentic_r2_candidates_include_slug_and_thumb(self):
        keys = vault_r2_key_candidates(
            pack_folder="agentic_ai",
            slug="agentic_ai_c01",
            thumb_filename="blog writing n8n.jpg",
        )
        self.assertIn("stream_videos/vault/agentic_ai/agentic_ai_c01.mp4", keys)
        self.assertIn("stream_videos/vault/agentic_ai/blog writing n8n.mp4", keys)

    def test_trading_r2_candidates_include_filename(self):
        keys = trading_r2_key_candidates("trading_secrets_01")
        self.assertIn("stream_videos/vault/trading/Secrets_M1_Final.mp4", keys)
        self.assertIn("Secrets_M1_Final.mp4", keys)


class VaultPlaylistSeedTests(TestCase):
    def test_seed_creates_agentic_playlist_with_video(self):
        stats = seed_all_vault_playlists(publish=True, link_r2=False, retire_legacy=False)
        self.assertGreaterEqual(stats.submodule_playlists, 1)

        playlist = StreamPlaylist.objects.get(vault_plan_slug="agentic_ai_c01")
        self.assertTrue(playlist.is_published)
        items = list(StreamPlaylistItem.objects.filter(playlist=playlist))
        self.assertEqual(len(items), 1)
        self.assertIsInstance(items[0].stream_video, StreamVideo)

    def test_seed_creates_trading_module_playlist(self):
        seed_all_vault_playlists(publish=True, link_r2=False, retire_legacy=False)
        module = StreamPlaylist.objects.get(vault_plan_slug="trading_master_secrets")
        self.assertGreaterEqual(module.items.count(), 17)

    def test_retire_legacy_unpublishes_fixture_slug(self):
        legacy = StreamPlaylist.objects.create(
            title="AI Automations",
            slug="ai-automations",
            category="business_model",
            is_published=True,
            is_coming_soon=False,
        )
        seed_all_vault_playlists(publish=True, link_r2=False, retire_legacy=True)
        legacy.refresh_from_db()
        self.assertFalse(legacy.is_published)
        self.assertTrue(legacy.is_coming_soon)
