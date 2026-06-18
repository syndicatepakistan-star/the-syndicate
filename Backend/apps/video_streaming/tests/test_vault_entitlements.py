from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.portal.models import UserDashboardEntitlement, UserPlanPurchase
from apps.video_streaming.vault_entitlements import user_has_vault_module_access

User = get_user_model()


class VaultEntitlementHierarchyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="vault@test.com", email="vault@test.com", password="x")
        self._purchase_counter = 0

    def _purchase(self, slug: str) -> None:
        self._purchase_counter += 1
        UserPlanPurchase.objects.create(
            user=self.user,
            plan_slug=slug,
            stripe_checkout_session_id=f"cs_test_{self._purchase_counter}",
            product_title=slug,
            amount_paid=9,
            status=UserPlanPurchase.Status.PAID,
            paid_at=timezone.now(),
        )

    def test_parent_module_unlocks_nested_lesson_only(self):
        self._purchase("trading_scalpel_protocol")
        self.assertTrue(user_has_vault_module_access(self.user, "trading_scalpel_protocol"))
        self.assertTrue(user_has_vault_module_access(self.user, "trading_scalpel_01"))
        self.assertTrue(user_has_vault_module_access(self.user, "trading_scalpel_10"))
        self.assertFalse(user_has_vault_module_access(self.user, "trading_master_secrets"))
        self.assertFalse(user_has_vault_module_access(self.user, "trading_secrets_01"))

    def test_single_lesson_does_not_unlock_siblings_or_parent(self):
        self._purchase("trading_secrets_03")
        self.assertTrue(user_has_vault_module_access(self.user, "trading_secrets_03"))
        self.assertFalse(user_has_vault_module_access(self.user, "trading_secrets_01"))
        self.assertFalse(user_has_vault_module_access(self.user, "trading_master_secrets"))
        self.assertFalse(user_has_vault_module_access(self.user, "trading_scalpel_01"))

    def test_full_trading_pack_unlocks_all_modules_and_lessons(self):
        self._purchase("trading_technical_analysis")
        self.assertTrue(user_has_vault_module_access(self.user, "trading_master_setups"))
        self.assertTrue(user_has_vault_module_access(self.user, "trading_setups_05"))
        self.assertTrue(user_has_vault_module_access(self.user, "trading_strategies_08"))

    def test_money_mastery_unlocks_all_vault_slugs(self):
        UserDashboardEntitlement.objects.create(
            user=self.user,
            access_tier=UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        )
        self.assertTrue(user_has_vault_module_access(self.user, "trading_scalpel_02"))
        self.assertTrue(user_has_vault_module_access(self.user, "agentic_ai_c01"))
