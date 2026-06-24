from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase

from accounts.views import _ensure_quiz_ticket_user_and_enrollment
from apps.quiz_funnel.models import Result as QuizResult
from apps.quiz_funnel.models import User as QuizFunnelUser
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase


class QuizTicketPurchasePreservationTests(TestCase):
    def setUp(self):
        self.email = "member@example.com"
        quiz_user = QuizFunnelUser.objects.create(email=self.email)
        QuizResult.objects.create(
            user=quiz_user,
            score=0,
            category="knight",
            ai_report="test",
        )
        self.free_playlist = StreamPlaylist.objects.create(
            title="Zero to One Million",
            slug="level1-psych-01",
            category=StreamPlaylist.Category.BUSINESS_PSYCHOLOGY,
            price=Decimal("0.00"),
            is_published=True,
            is_coming_soon=False,
        )
        self.paid_playlist = StreamPlaylist.objects.create(
            title="App Building Using Flutter",
            slug="level1-model-03",
            category=StreamPlaylist.Category.BUSINESS_MODEL,
            price=Decimal("14.00"),
            is_published=True,
            is_coming_soon=False,
        )

    def test_quiz_ticket_login_does_not_delete_stripe_purchases(self):
        user = User.objects.create_user(
            username="quiz_ticket_abc123",
            email=self.email,
            password="unused",
        )
        StreamPlaylistPurchase.objects.create(
            user=user,
            playlist=self.paid_playlist,
            status=StreamPlaylistPurchase.Status.PAID,
            stripe_session_id="cs_test_paid_flutter",
            stripe_checkout_session_id="cs_test_paid_flutter",
            amount_paid=Decimal("14.00"),
            currency="usd",
        )

        _ensure_quiz_ticket_user_and_enrollment(self.email)

        self.assertTrue(
            StreamPlaylistPurchase.objects.filter(
                user=user,
                playlist=self.paid_playlist,
                status=StreamPlaylistPurchase.Status.PAID,
            ).exists()
        )
        self.assertTrue(
            StreamPlaylistPurchase.objects.filter(
                user=user,
                playlist=self.free_playlist,
                stripe_session_id__startswith="quiz_ticket_",
            ).exists()
        )
