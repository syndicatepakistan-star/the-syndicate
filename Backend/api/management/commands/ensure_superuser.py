"""Create or update admin superuser from env (Railway / automated deploy)."""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = (
        "If DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_USERNAME (optional) and DJANGO_SUPERUSER_PASSWORD are set, ensure that user "
        "exists as an active superuser and that their password matches the env var (every deploy). "
        "Set DJANGO_SUPERUSER_NO_PASSWORD_SYNC=1 to only create when missing, never change password."
    )

    def _create_superuser_bypassing_validators(self, username: str, email: str, password: str) -> None:
        """Railway bootstrap: create staff user without MinimumLengthValidator blocking short env passwords."""
        user = User(username=username, email=email, is_staff=True, is_superuser=True, is_active=True)
        user.set_password(password)
        user.save()

    def handle(self, *args, **options):
        email = (os.environ.get("DJANGO_SUPERUSER_EMAIL") or "").strip().lower()
        username = (os.environ.get("DJANGO_SUPERUSER_USERNAME") or "").strip()
        password = (os.environ.get("DJANGO_SUPERUSER_PASSWORD") or "").strip()
        if not username:
            username = email
        if not email or not password:
            self.stdout.write(
                "ensure_superuser: skip (set DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD; optional DJANGO_SUPERUSER_USERNAME)"
            )
            return

        no_sync = (os.environ.get("DJANGO_SUPERUSER_NO_PASSWORD_SYNC") or "").strip().lower() in (
            "1",
            "true",
            "yes",
        )
        existing = User.objects.filter(username=username).first()
        if existing is None:
            existing = User.objects.filter(email__iexact=email).first()

        if existing:
            if no_sync:
                self.stdout.write(f"ensure_superuser: user exists, NO_PASSWORD_SYNC set — left unchanged ({username})")
                return
            existing.username = username
            existing.email = email
            existing.is_staff = True
            existing.is_superuser = True
            existing.is_active = True
            existing.set_password(password)
            existing.save(update_fields=["username", "email", "is_staff", "is_superuser", "is_active", "password"])
            self.stdout.write(
                self.style.SUCCESS(
                    f"ensure_superuser: updated staff/superuser + password for {username} (login admin with email {email} or username {username})"
                )
            )
            return

        try:
            User.objects.create_superuser(username=username, email=email, password=password)
        except Exception:
            self._create_superuser_bypassing_validators(username, email, password)
        self.stdout.write(
            self.style.SUCCESS(
                f"ensure_superuser: created superuser {username} (login admin with email {email} or username {username})"
            )
        )
