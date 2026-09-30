"""Backfill diagnosis (Completed / Not Completed) onto Bot A Leads sheet rows."""

from __future__ import annotations

import time

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

from apps.quiz_funnel.models import User


class Command(BaseCommand):
    help = (
        "Sync quiz-user diagnosis to Bot A Leads sheet. "
        "Default: ONE batch request (recommended). Use --one-by-one for legacy mode."
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
            help="Max users to process (0 = all).",
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
        parser.add_argument(
            "--one-by-one",
            action="store_true",
            help="Legacy mode: POST each user separately (slow; can hit Sheets rate limits).",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=0.4,
            help="Delay between one-by-one calls only (default 0.4).",
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
        only_completed = bool(options["only_completed"])
        only_not_completed = bool(options["only_not_completed"])
        one_by_one = bool(options["one_by_one"])
        delay = float(options["delay"] or 0)
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
            self.stdout.write(self.style.WARNING("No matching quiz users."))
            return

        items = []
        for user in users:
            items.append(
                {
                    "email": (user.email or "").strip().lower(),
                    "phone": (user.phone or "").strip(),
                    "diagnosis": (
                        "Completed"
                        if getattr(user, "result", None) is not None
                        else "Not Completed"
                    ),
                }
            )

        self.stdout.write(
            f"Backfilling diagnosis for {total} user(s). "
            f"mode={'one-by-one' if one_by_one else 'batch'} "
            f"dry_run={dry_run} webhook={webhook_url or '(dry-run)'}"
        )

        if dry_run:
            for index, item in enumerate(items, start=1):
                self.stdout.write(
                    f"DRY-RUN [{index}/{total}] {item['email'] or '-'} "
                    f"{item['phone'] or '-'} → {item['diagnosis']}"
                )
            self.stdout.write(self.style.SUCCESS(f"Done. dry_run users={total}"))
            return

        if not one_by_one:
            batch_url = webhook_url.rstrip("/")
            if batch_url.endswith("/webhook/lead"):
                batch_url = batch_url[: -len("/webhook/lead")] + "/webhook/leads/backfill-diagnosis"
            elif "/webhook/leads/backfill-diagnosis" not in batch_url:
                batch_url = batch_url.rstrip("/") + "/webhook/leads/backfill-diagnosis"

            try:
                response = requests.post(
                    batch_url,
                    json={"items": items},
                    headers={"Content-Type": "application/json"},
                    timeout=120,
                )
            except Exception as exc:
                raise CommandError(f"Batch request failed: {exc}") from exc

            if response.status_code == 404:
                self.stdout.write(
                    self.style.WARNING(
                        "Batch endpoint 404 — Bot A may need redeploy. "
                        "Falling back to one-by-one mode."
                    )
                )
                one_by_one = True
            elif not (200 <= response.status_code < 300):
                raise CommandError(
                    f"Batch HTTP {response.status_code}: {response.text[:300]}"
                )
            else:
                body = response.json() if response.content else {}
                updated = int(body.get("updated") or 0)
                skipped = int(body.get("skipped") or 0)
                rows_touched = int(body.get("rows_touched") or 0)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Done batch. updated_users={updated} skipped_users={skipped} "
                        f"sheet_rows_touched={rows_touched}"
                    )
                )
                skipped_items = body.get("skipped_items") or []
                if skipped_items:
                    self.stdout.write(
                        self.style.WARNING(
                            f"First skipped examples ({len(skipped_items)} shown):"
                        )
                    )
                    for item in skipped_items[:20]:
                        self.stdout.write(
                            f"  SKIP {item.get('email') or '-'} "
                            f"{item.get('phone') or '-'} → {item.get('diagnosis')}"
                        )
                self.stdout.write(
                    "If Amy/etc still wrong: confirm Bot A GOOGLE_SHEET_ID is the same "
                    "spreadsheet you are viewing, worksheet=Leads."
                )
                return

        # Legacy one-by-one
        updated = skipped = failed = 0
        for index, item in enumerate(items, start=1):
            label = (
                f"[{index}/{total}] {item['email'] or '-'} "
                f"{item['phone'] or '-'} → {item['diagnosis']}"
            )
            try:
                response = requests.post(
                    webhook_url,
                    json={
                        **item,
                        "name": "",
                        "sheet_only": True,
                        "source": "syn_diagnosis_backfill",
                    },
                    headers={"Content-Type": "application/json"},
                    timeout=45,
                )
                body = response.json() if response.content else {}
            except Exception as exc:
                failed += 1
                self.stdout.write(self.style.ERROR(f"FAIL {label} err={exc}"))
                continue

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
                self.stdout.write(self.style.WARNING(f"SKIPPED {label}"))
            elif 200 <= response.status_code < 300:
                updated += 1
                self.stdout.write(self.style.WARNING(f"OK(unknown) {label}"))
            else:
                failed += 1
                self.stdout.write(self.style.ERROR(f"FAIL {label} http={response.status_code}"))

            if index < total and delay > 0:
                time.sleep(delay)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. updated={updated} skipped={skipped} failed={failed}"
            )
        )
