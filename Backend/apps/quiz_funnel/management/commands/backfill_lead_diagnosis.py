"""Backfill diagnosis (Completed / Not Completed) onto Bot A Leads sheet rows."""

from __future__ import annotations

import time

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.quiz_funnel.intake_tokens import intake_url_for_user
from apps.quiz_funnel.lead_webhook import post_lead_webhook
from apps.quiz_funnel.models import User


class Command(BaseCommand):
    help = (
        "For each quiz user with a phone, POST diagnosis to LEAD_WEBHOOK_URL with "
        "sheet_only=true so Bot A updates existing Leads rows (no WhatsApp)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be sent without calling the webhook.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Max users to process (0 = all with phone).",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=0.4,
            help="Seconds between webhook calls (default 0.4).",
        )
        parser.add_argument(
            "--only-completed",
            action="store_true",
            help="Only users who finished the quiz (have a Result).",
        )
        parser.add_argument(
            "--only-not-completed",
            action="store_true",
            help="Only users without a Result.",
        )

    def handle(self, *args, **options):
        webhook_url = (getattr(settings, "LEAD_WEBHOOK_URL", "") or "").strip()
        dry_run = bool(options["dry_run"])
        if not webhook_url and not dry_run:
            raise CommandError("LEAD_WEBHOOK_URL is not set in Django settings/env.")

        limit = int(options["limit"] or 0)
        delay = float(options["delay"] or 0)
        only_completed = bool(options["only_completed"])
        only_not_completed = bool(options["only_not_completed"])
        if only_completed and only_not_completed:
            raise CommandError("Use only one of --only-completed / --only-not-completed.")

        qs = User.objects.select_related("result").order_by("id")
        # Prefer users who can match a sheet row (phone and/or email).
        qs = qs.exclude(phone__isnull=True, email__isnull=True)
        # Keep rows that have at least one of phone/email non-empty.
        from django.db.models import Q

        qs = qs.filter(
            (Q(phone__isnull=False) & ~Q(phone=""))
            | (Q(email__isnull=False) & ~Q(email=""))
        )
        if only_completed:
            qs = qs.filter(result__isnull=False)
        elif only_not_completed:
            qs = qs.filter(result__isnull=True)
        if limit:
            qs = qs[:limit]

        users = list(qs)
        total = len(users)
        if not total:
            self.stdout.write(self.style.WARNING("No matching quiz users with phone."))
            return

        self.stdout.write(
            f"Backfilling diagnosis for {total} user(s). "
            f"delay={delay}s dry_run={dry_run} webhook={webhook_url or '(dry-run)'}"
        )

        ok = failed = 0
        for index, user in enumerate(users, start=1):
            phone = (user.phone or "").strip()
            email = (user.email or "").strip().lower()
            name = (user.name or "").strip()
            diagnosis = (
                "Completed"
                if getattr(user, "result", None) is not None
                else "Not Completed"
            )
            intake_url = ""
            try:
                if email or user.intake_ref:
                    intake_url = intake_url_for_user(user)
            except Exception:
                intake_url = ""

            label = f"[{index}/{total}] id={user.id} {email or '-'} {phone} → {diagnosis}"
            if dry_run:
                self.stdout.write(f"DRY-RUN {label}")
                continue

            sent = post_lead_webhook(
                name=name,
                email=email,
                phone=phone,
                intake_url=intake_url,
                diagnosis=diagnosis,
                sheet_only=True,
                source="syn_diagnosis_backfill",
                timeout=45,
            )
            if sent:
                ok += 1
                self.stdout.write(self.style.SUCCESS(f"OK {label}"))
            else:
                failed += 1
                self.stdout.write(self.style.ERROR(f"FAIL {label}"))

            if index < total and delay > 0:
                time.sleep(delay)

        self.stdout.write(
            self.style.SUCCESS(f"Done. ok={ok} failed={failed} dry_run={dry_run}")
        )
