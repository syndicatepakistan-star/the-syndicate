"""Backfill diagnosis (Completed / Not Completed) onto Bot A Leads sheet rows."""

from __future__ import annotations

import time

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

from apps.quiz_funnel.intake_tokens import intake_url_for_user
from apps.quiz_funnel.models import User


class Command(BaseCommand):
    help = (
        "For each quiz user with phone/email, POST diagnosis to LEAD_WEBHOOK_URL with "
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
        if webhook_url.upper().startswith("LEAD_WEBHOOK_URL="):
            webhook_url = webhook_url.split("=", 1)[1].strip()
        dry_run = bool(options["dry_run"])
        if not webhook_url and not dry_run:
            raise CommandError("LEAD_WEBHOOK_URL is not set in Django settings/env.")
        if webhook_url and not webhook_url.startswith(("http://", "https://")):
            raise CommandError(f"LEAD_WEBHOOK_URL is not a valid URL: {webhook_url!r}")

        limit = int(options["limit"] or 0)
        delay = float(options["delay"] or 0)
        only_completed = bool(options["only_completed"])
        only_not_completed = bool(options["only_not_completed"])
        if only_completed and only_not_completed:
            raise CommandError("Use only one of --only-completed / --only-not-completed.")

        qs = User.objects.select_related("result").order_by("id")
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
            self.stdout.write(self.style.WARNING("No matching quiz users with phone/email."))
            return

        self.stdout.write(
            f"Backfilling diagnosis for {total} user(s). "
            f"delay={delay}s dry_run={dry_run} webhook={webhook_url or '(dry-run)'}"
        )

        updated = skipped = failed = 0
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

            label = f"[{index}/{total}] id={user.id} {email or '-'} {phone or '-'} → {diagnosis}"
            if dry_run:
                self.stdout.write(f"DRY-RUN {label}")
                continue

            payload = {
                "name": name,
                "first_name": name.split(" ", 1)[0] if name else "",
                "full_name": name,
                "email": email,
                "phone": phone,
                "source": "syn_diagnosis_backfill",
                "diagnosis": diagnosis,
                "sheet_only": True,
            }
            if intake_url:
                payload["intake_url"] = intake_url

            try:
                response = requests.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=45,
                )
            except Exception as exc:
                failed += 1
                self.stdout.write(self.style.ERROR(f"FAIL {label} err={exc}"))
                continue

            body: dict = {}
            try:
                if response.content:
                    parsed = response.json()
                    if isinstance(parsed, dict):
                        body = parsed
            except Exception:
                body = {}

            action = str(body.get("action") or "")
            sheet_updated = bool(body.get("sheet_updated")) or action == "sheet_diagnosis_updated"
            sheet_skipped = action == "sheet_diagnosis_skipped" or (
                response.ok and body.get("ok") is False
            )

            if 200 <= response.status_code < 300 and sheet_updated:
                updated += 1
                self.stdout.write(self.style.SUCCESS(f"UPDATED {label}"))
            elif 200 <= response.status_code < 300 and sheet_skipped:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"SKIPPED {label} (no matching Leads row — {body.get('detail') or 'not on sheet'})"
                    )
                )
            elif 200 <= response.status_code < 300:
                # Older bot deploy without sheet_updated field — treat as soft OK.
                updated += 1
                self.stdout.write(
                    self.style.WARNING(f"OK(unknown) {label} action={action or '-'}")
                )
            else:
                failed += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"FAIL {label} http={response.status_code} body={response.text[:160]}"
                    )
                )

            if index < total and delay > 0:
                time.sleep(delay)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. updated={updated} skipped={skipped} failed={failed} dry_run={dry_run}"
            )
        )
        self.stdout.write(
            "Note: SKIPPED = Django user not found on Leads sheet (extra sheet rows stay blank). "
            "group_add_* is separate — run Bot A scripts/backfill_group_columns.py"
        )
