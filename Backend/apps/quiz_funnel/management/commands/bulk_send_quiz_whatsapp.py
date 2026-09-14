"""Send WhatsApp bot messages to existing quiz users (bulk backfill)."""

from __future__ import annotations

import time

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.quiz_funnel.intake_tokens import ensure_intake_ref, intake_url_for_user
from apps.quiz_funnel.models import User

DEFAULT_DELAY_SECONDS = 4
WEBHOOK_TIMEOUT_SECONDS = 45


class Command(BaseCommand):
    help = (
        "POST each existing quiz user (with phone) to LEAD_WEBHOOK_URL so the "
        "WhatsApp bot validates, logs to Sheet, and sends the message."
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
            default=DEFAULT_DELAY_SECONDS,
            help=f"Seconds to wait between each lead (default {DEFAULT_DELAY_SECONDS}).",
        )
        parser.add_argument(
            "--skip-id",
            type=int,
            default=0,
            help="Skip users with id <= this value (resume a stopped run).",
        )

    def handle(self, *args, **options):
        webhook_url = (getattr(settings, "LEAD_WEBHOOK_URL", "") or "").strip()
        if not webhook_url and not options["dry_run"]:
            raise CommandError("LEAD_WEBHOOK_URL is not set in Django settings/env.")

        dry_run = bool(options["dry_run"])
        limit = int(options["limit"] or 0)
        delay = float(options["delay"] or DEFAULT_DELAY_SECONDS)
        skip_id = int(options["skip_id"] or 0)

        qs = (
            User.objects.exclude(phone__isnull=True)
            .exclude(phone="")
            .order_by("id")
        )
        if skip_id:
            qs = qs.filter(id__gt=skip_id)
        if limit:
            qs = qs[:limit]

        users = list(qs)
        total = len(users)
        if not total:
            self.stdout.write(self.style.WARNING("No quiz users with phone found."))
            return

        self.stdout.write(
            f"Processing {total} user(s). Delay={delay}s. Webhook={webhook_url or '(dry-run)'}"
        )
        if not dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "This will re-message users who already received WhatsApp. "
                    "Use --dry-run first to review."
                )
            )

        sent = failed = skipped = 0

        for index, user in enumerate(users, start=1):
            phone = (user.phone or "").strip()
            if not phone:
                skipped += 1
                continue

            ensure_intake_ref(user)
            intake_url = intake_url_for_user(user)
            name = (user.name or "").strip()
            email = (user.email or "").strip().lower()

            label = f"[{index}/{total}] id={user.id} {name} {phone}"
            if dry_run:
                self.stdout.write(f"DRY-RUN {label} -> {intake_url}")
                continue

            payload = {
                "name": name,
                "email": email,
                "phone": phone,
                "source": "syn_diagnosis_quiz_bulk",
                "intake_url": intake_url,
            }

            try:
                response = requests.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=WEBHOOK_TIMEOUT_SECONDS,
                )
                if 200 <= response.status_code < 300:
                    sent += 1
                    self.stdout.write(self.style.SUCCESS(f"OK {label}"))
                else:
                    failed += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f"FAIL {label} status={response.status_code} body={response.text[:200]}"
                        )
                    )
            except Exception as exc:
                failed += 1
                self.stdout.write(self.style.ERROR(f"FAIL {label} error={exc}"))

            if index < total and delay > 0:
                time.sleep(delay)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. sent={sent} failed={failed} skipped={skipped} dry_run={dry_run}"
            )
        )
