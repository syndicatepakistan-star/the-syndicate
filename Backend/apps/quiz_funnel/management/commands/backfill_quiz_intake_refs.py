"""Generate intake_ref for existing quiz users + optional Klaviyo profile sync."""

from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.quiz_funnel.intake_tokens import ensure_intake_ref, intake_url_for_ref
from apps.quiz_funnel.klaviyo import subscribe_syn_diagnosis_email
from apps.quiz_funnel.models import User


class Command(BaseCommand):
    help = "Backfill intake_ref for quiz users missing a token; optionally push intake_url to Klaviyo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--sync-klaviyo",
            action="store_true",
            help="Update Klaviyo profile with intake_ref and intake_url for each backfilled user.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Max users to process (0 = all missing intake_ref).",
        )

    def handle(self, *args, **options):
        sync_klaviyo = bool(options["sync_klaviyo"])
        limit = int(options["limit"] or 0)

        qs = User.objects.filter(intake_ref__isnull=True) | User.objects.filter(intake_ref="")
        qs = qs.distinct().order_by("id")
        if limit > 0:
            qs = qs[:limit]

        count = 0
        for user in qs:
            email = (user.email or "").strip()
            if not email:
                self.stdout.write(self.style.WARNING(f"Skip user id={user.id} — no email"))
                continue
            ref = ensure_intake_ref(user)
            count += 1
            self.stdout.write(f"User id={user.id} {email} → ref={ref}")
            if sync_klaviyo:
                result = getattr(user, "result", None)
                props = {
                    "intake_ref": ref,
                    "intake_url": intake_url_for_ref(ref),
                }
                if result:
                    props.update(
                        {
                            "syn_diagnosis_score": result.score,
                            "syn_diagnosis_category": result.category or "",
                            "syn_diagnosis_virus": result.virus or "",
                        }
                    )
                subscribe_syn_diagnosis_email(
                    email=email,
                    name=user.name or "",
                    phone=user.phone or "",
                    properties=props,
                )

        self.stdout.write(self.style.SUCCESS(f"Backfilled intake_ref for {count} user(s)."))
