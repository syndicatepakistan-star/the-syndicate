"""
Attach Google Meet to existing audit bookings (via Domain-Wide Delegation)
and optionally email + WhatsApp the confirmation — no manual Calendar edits.

Examples (Railway / local):

  python manage.py repair_audit_bookings --ids 7,8
  python manage.py repair_audit_bookings --missing-meet --notify
  python manage.py repair_audit_bookings --ids 7,8 --dry-run
"""

from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError

from apps.quiz_funnel.calendar_service import BookingError, repair_booking_meet_and_notify
from apps.quiz_funnel.models import AuditBooking


class Command(BaseCommand):
    help = (
        "Add Google Meet to booked audits that are missing a meet_link, "
        "then send email + WhatsApp confirmation."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--ids",
            type=str,
            default="",
            help="Comma-separated AuditBooking ids (e.g. 7,8). Default: all booked missing Meet.",
        )
        parser.add_argument(
            "--missing-meet",
            action="store_true",
            help="Process all BOOKED rows with empty meet_link (default when --ids omitted).",
        )
        parser.add_argument(
            "--notify",
            action="store_true",
            default=True,
            help="Send email + WhatsApp after Meet is attached (default: on).",
        )
        parser.add_argument(
            "--no-notify",
            action="store_true",
            help="Only attach Meet / save link; do not send messages.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List bookings that would be repaired without calling Google or webhooks.",
        )

    def handle(self, *args, **options):
        ids_raw = (options.get("ids") or "").strip()
        dry_run = bool(options.get("dry_run"))
        notify = not bool(options.get("no_notify"))

        qs = AuditBooking.objects.filter(status=AuditBooking.Status.BOOKED).select_related("user")
        if ids_raw:
            try:
                ids = [int(x.strip()) for x in ids_raw.split(",") if x.strip()]
            except ValueError as exc:
                raise CommandError("--ids must be comma-separated integers") from exc
            qs = qs.filter(pk__in=ids)
        else:
            qs = qs.filter(meet_link="")

        rows = list(qs.order_by("id"))
        if not rows:
            self.stdout.write(self.style.WARNING("No matching bookings."))
            return

        self.stdout.write(f"Found {len(rows)} booking(s). notify={notify} dry_run={dry_run}")
        ok = 0
        for booking in rows:
            email = booking.user.email or "?"
            self.stdout.write(
                f"#{booking.pk} {email} event={booking.google_event_id or '-'} "
                f"meet={bool((booking.meet_link or '').strip())}"
            )
            if dry_run:
                continue
            try:
                meet = repair_booking_meet_and_notify(booking, notify=notify)
                self.stdout.write(self.style.SUCCESS(f"  OK meet={meet}"))
                ok += 1
            except BookingError as exc:
                self.stderr.write(self.style.ERROR(f"  FAIL: {exc.message}"))
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"  FAIL: {exc}"))

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f"Repaired {ok}/{len(rows)}"))
