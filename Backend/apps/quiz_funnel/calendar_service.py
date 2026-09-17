"""
Google Calendar availability + Meet booking for founder audits.

Datetimes in DB / API payloads: UTC. Slot generation window: Asia/Karachi (configurable).
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone as dt_timezone
from typing import Iterable
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone as dj_timezone
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .models import AuditBooking, User

logger = logging.getLogger(__name__)

CALENDAR_SCOPES = ("https://www.googleapis.com/auth/calendar",)


class BookingError(Exception):
    """User-facing booking failure (safe message)."""

    def __init__(self, message: str, *, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


@dataclass(frozen=True)
class Slot:
    start: datetime  # aware UTC
    end: datetime  # aware UTC

    def as_api_dict(self) -> dict[str, str]:
        return {
            "start": self.start.astimezone(dt_timezone.utc).isoformat().replace("+00:00", "Z"),
            "end": self.end.astimezone(dt_timezone.utc).isoformat().replace("+00:00", "Z"),
        }


def _tz() -> ZoneInfo:
    return ZoneInfo(getattr(settings, "BOOKING_TIMEZONE", None) or "Asia/Karachi")


def _as_utc(dt: datetime) -> datetime:
    if dj_timezone.is_naive(dt):
        dt = dj_timezone.make_aware(dt, dt_timezone.utc)
    return dt.astimezone(dt_timezone.utc)


def _parse_iso_utc(value: str) -> datetime:
    raw = (value or "").strip()
    if not raw:
        raise BookingError("Missing slot time.")
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError as exc:
        raise BookingError("Invalid slot time format.") from exc
    return _as_utc(parsed)


def get_credentials() -> Credentials:
    client_id = (getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", None) or "").strip()
    client_secret = (getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", None) or "").strip()
    refresh_token = (getattr(settings, "GOOGLE_OAUTH_REFRESH_TOKEN", None) or "").strip()
    if not client_id or not client_secret or not refresh_token:
        raise BookingError(
            "Audit booking is not configured yet. Please try again later.",
            status=503,
        )

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=list(CALENDAR_SCOPES),
    )
    try:
        creds.refresh(Request())
    except Exception as exc:
        logger.exception("Google OAuth refresh failed")
        raise BookingError(
            "Could not connect to the audit calendar. Please try again shortly.",
            status=503,
        ) from exc
    return creds


def _calendar_service():
    return build("calendar", "v3", credentials=get_credentials(), cache_discovery=False)


def _calendar_id() -> str:
    return (getattr(settings, "GOOGLE_CALENDAR_ID", None) or "primary").strip() or "primary"


def generate_candidate_slots(
    *,
    now: datetime | None = None,
    days_ahead: int | None = None,
) -> list[Slot]:
    """Build candidate 30-min slots in local booking TZ, returned as UTC."""
    local_tz = _tz()
    now_utc = _as_utc(now or dj_timezone.now())
    now_local = now_utc.astimezone(local_tz)

    duration = timedelta(minutes=int(getattr(settings, "BOOKING_DURATION_MINUTES", 30) or 30))
    ahead = int(days_ahead if days_ahead is not None else getattr(settings, "BOOKING_DAYS_AHEAD", 14) or 14)
    hour_start = int(getattr(settings, "BOOKING_HOUR_START", 15) or 15)
    hour_end = int(getattr(settings, "BOOKING_HOUR_END", 19) or 19)
    min_notice = timedelta(minutes=int(getattr(settings, "BOOKING_MIN_NOTICE_MINUTES", 60) or 60))
    weekdays = set(getattr(settings, "BOOKING_WEEKDAYS", (0, 1, 2, 3)) or (0, 1, 2, 3))
    earliest = now_local + min_notice

    slots: list[Slot] = []
    for day_offset in range(0, max(0, ahead) + 1):
        day: date = (now_local.date() + timedelta(days=day_offset))
        if day.weekday() not in weekdays:
            continue
        cursor = datetime(day.year, day.month, day.day, hour_start, 0, tzinfo=local_tz)
        window_end = datetime(day.year, day.month, day.day, hour_end, 0, tzinfo=local_tz)
        while cursor + duration <= window_end:
            slot_end = cursor + duration
            if cursor >= earliest:
                slots.append(Slot(start=_as_utc(cursor), end=_as_utc(slot_end)))
            cursor += duration

    return slots


def get_busy_intervals(
    time_min: datetime,
    time_max: datetime,
    *,
    calendar_id: str | None = None,
) -> list[tuple[datetime, datetime]]:
    """Query Google freeBusy; returns UTC busy intervals."""
    service = _calendar_service()
    cal_id = calendar_id or _calendar_id()
    body = {
        "timeMin": _as_utc(time_min).isoformat().replace("+00:00", "Z"),
        "timeMax": _as_utc(time_max).isoformat().replace("+00:00", "Z"),
        "timeZone": "UTC",
        "items": [{"id": cal_id}],
    }
    try:
        result = service.freebusy().query(body=body).execute()
    except Exception as exc:
        logger.exception("Google freeBusy failed")
        raise BookingError(
            "Could not check calendar availability. Please try again shortly.",
            status=503,
        ) from exc

    calendars = (result or {}).get("calendars") or {}
    cal_data = calendars.get(cal_id) or {}
    if cal_data.get("errors"):
        logger.error("Google freeBusy calendar errors: %s", cal_data.get("errors"))
        raise BookingError(
            "Could not check calendar availability. Please try again shortly.",
            status=503,
        )

    busy: list[tuple[datetime, datetime]] = []
    for row in cal_data.get("busy") or []:
        start = _parse_iso_utc(str(row.get("start") or ""))
        end = _parse_iso_utc(str(row.get("end") or ""))
        if end > start:
            busy.append((start, end))
    return busy


def _intervals_overlap(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> bool:
    return start_a < end_b and start_b < end_a


def _is_slot_free(
    slot: Slot,
    busy: Iterable[tuple[datetime, datetime]],
    *,
    buffer: timedelta,
) -> bool:
    # Keep buffer after each meeting so consecutive audits are not back-to-back.
    padded_start = slot.start
    padded_end = slot.end + buffer
    for busy_start, busy_end in busy:
        if _intervals_overlap(padded_start, padded_end, busy_start, busy_end):
            return False
    return True


def list_available_slots(*, now: datetime | None = None) -> tuple[str, list[Slot]]:
    """Return (timezone_name, available slots) after applying freeBusy + rules."""
    tz_name = getattr(settings, "BOOKING_TIMEZONE", None) or "Asia/Karachi"
    candidates = generate_candidate_slots(now=now)
    if not candidates:
        return tz_name, []

    buffer = timedelta(minutes=int(getattr(settings, "BOOKING_BUFFER_MINUTES", 15) or 15))
    time_min = candidates[0].start - buffer
    time_max = candidates[-1].end + buffer
    busy = get_busy_intervals(time_min, time_max)
    available = [slot for slot in candidates if _is_slot_free(slot, busy, buffer=buffer)]
    return tz_name, available


def _extract_meet_link(event: dict) -> str:
    hangout = (event.get("hangoutLink") or "").strip()
    if hangout:
        return hangout
    conference = event.get("conferenceData") or {}
    for entry in conference.get("entryPoints") or []:
        if (entry.get("entryPointType") or "") == "video":
            uri = (entry.get("uri") or "").strip()
            if uri:
                return uri
    for entry in conference.get("entryPoints") or []:
        uri = (entry.get("uri") or "").strip()
        if uri.startswith("http"):
            return uri
    return ""


def _safe_zoneinfo(name: str | None) -> ZoneInfo | None:
    raw = (name or "").strip()
    if not raw:
        return None
    try:
        return ZoneInfo(raw)
    except Exception:
        return None


def create_audit_event(
    user: User,
    slot_start: datetime,
    slot_end: datetime,
    *,
    display_timezone: str | None = None,
) -> tuple[str, str]:
    """
    Create Google Calendar event with Meet.
    Returns (event_id, meet_link). Raises BookingError if Meet link missing.

    Guest-facing name fields use first name only. We do not send Google's
    calendar invite email (sendUpdates=none): the organizer calendar is often
    Europe/Paris, so Google's "When" line shows host TZ instead of the guest's
    city. Confirmation + local time go out via our booking email / WhatsApp.
    """
    start = _as_utc(slot_start)
    end = _as_utc(slot_end)
    if end <= start:
        raise BookingError("Invalid slot range.")

    service = _calendar_service()
    cal_id = _calendar_id()
    founder = (getattr(settings, "BOOKING_FOUNDER_EMAIL", None) or "").strip()
    guest_email = (user.email or "").strip()
    full_name = (user.name or "").strip() or "Guest"
    from .booking_mailer import first_name_from, format_slot_in_timezone

    guest_first = first_name_from(full_name) or full_name

    summary = f"Founder Audit — {guest_first}"
    event_tz_name = (display_timezone or "").strip() or "UTC"
    event_tz = _safe_zoneinfo(event_tz_name)
    if event_tz is None:
        event_tz_name = "UTC"
        event_tz = ZoneInfo("UTC")

    start_local = start.astimezone(event_tz)
    end_local = end.astimezone(event_tz)

    try:
        guest_when = format_slot_in_timezone(start, end, event_tz_name)
    except Exception:
        guest_when = f"{start_local.strftime('%Y-%m-%d %H:%M')} – {end_local.strftime('%H:%M')} ({event_tz_name})"

    description_lines = [
        "Syn Diagnosis founder audit call.",
        f"Guest: {guest_first}",
        f"When: {guest_when}",
    ]
    if guest_email:
        description_lines.append(f"Email: {guest_email}")
    if user.phone:
        description_lines.append(f"Phone: {user.phone}")
    if user.intake_ref:
        description_lines.append(f"Intake ref: {user.intake_ref}")

    attendees: list[dict[str, str]] = []
    if guest_email:
        attendees.append({"email": guest_email, "displayName": guest_first})
    if founder and founder.lower() != guest_email.lower():
        attendees.append({"email": founder})
    # Store wall times in the guest's IANA zone (calendar UI / ICS consumers).
    start_payload = {
        "dateTime": start_local.strftime("%Y-%m-%dT%H:%M:%S"),
        "timeZone": event_tz_name,
    }
    end_payload = {
        "dateTime": end_local.strftime("%Y-%m-%dT%H:%M:%S"),
        "timeZone": event_tz_name,
    }

    body: dict = {
        "summary": summary,
        "description": "\n".join(description_lines),
        "start": start_payload,
        "end": end_payload,
        "conferenceData": {
            "createRequest": {
                "requestId": f"audit-{user.pk}-{uuid.uuid4().hex[:16]}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
        "guestsCanModify": False,
        "guestsCanInviteOthers": False,
        "guestsCanSeeOtherGuests": True,
    }
    if attendees:
        body["attendees"] = attendees

    try:
        event = (
            service.events()
            .insert(
                calendarId=cal_id,
                body=body,
                conferenceDataVersion=1,
                # Suppress Google invite email — its "When" uses organizer calendar TZ (e.g. Paris).
                sendUpdates="none",
            )
            .execute()
        )
    except Exception as exc:
        logger.exception("Google event create failed for user_id=%s", user.pk)
        raise BookingError(
            "Could not create the audit meeting. Please try another slot.",
            status=502,
        ) from exc

    event_id = str(event.get("id") or "").strip()
    meet_link = _extract_meet_link(event)
    if not event_id or not meet_link:
        # Avoid half-success: attempt delete if we got an id without Meet.
        if event_id:
            try:
                service.events().delete(calendarId=cal_id, eventId=event_id, sendUpdates="none").execute()
            except Exception:
                logger.exception("Failed to roll back Google event %s without Meet link", event_id)
        raise BookingError(
            "Could not create a Google Meet link. Please try again.",
            status=502,
        )
    return event_id, meet_link


def book_slot(
    user: User,
    slot_start: datetime | str,
    slot_end: datetime | str,
    *,
    user_timezone: str | None = None,
) -> dict:
    """
    Transactional book:
    1) reject if user already has active booked
    2) re-validate freeBusy
    3) create Google event + Meet
    4) save AuditBooking
    """
    start = _as_utc(slot_start if isinstance(slot_start, datetime) else _parse_iso_utc(str(slot_start)))
    end = _as_utc(slot_end if isinstance(slot_end, datetime) else _parse_iso_utc(str(slot_end)))
    duration = timedelta(minutes=int(getattr(settings, "BOOKING_DURATION_MINUTES", 30) or 30))
    if end - start != duration:
        # Allow 1s drift from ISO round-trip
        if abs((end - start) - duration) > timedelta(seconds=2):
            raise BookingError("That slot length is not valid.")

    founder_tz = getattr(settings, "BOOKING_TIMEZONE", None) or "Asia/Karachi"
    guest_tz_name = (user_timezone or "").strip()
    if _safe_zoneinfo(guest_tz_name) is None:
        guest_tz_name = founder_tz
    # Persist + label invite in the guest's selected city TZ (e.g. Europe/London).
    display_tz = guest_tz_name
    buffer = timedelta(minutes=int(getattr(settings, "BOOKING_BUFFER_MINUTES", 15) or 15))
    slot = Slot(start=start, end=end)

    # Must still be an offered candidate (rules + min notice).
    candidates = generate_candidate_slots()
    if not any(c.start == slot.start and c.end == slot.end for c in candidates):
        raise BookingError("That time is no longer available. Please pick another slot.")

    with transaction.atomic():
        existing = (
            AuditBooking.objects.select_for_update()
            .filter(user=user, status=AuditBooking.Status.BOOKED)
            .first()
        )
        if existing:
            raise BookingError("You already have an audit booked.", status=409)

        busy = get_busy_intervals(slot.start - buffer, slot.end + buffer)
        if not _is_slot_free(slot, busy, buffer=buffer):
            raise BookingError("That time was just taken. Please pick another slot.", status=409)

        event_id, meet_link = create_audit_event(
            user,
            slot.start,
            slot.end,
            display_timezone=display_tz,
        )

        try:
            booking = AuditBooking.objects.create(
                user=user,
                slot_start=slot.start,
                slot_end=slot.end,
                timezone=display_tz,
                google_event_id=event_id,
                meet_link=meet_link,
                status=AuditBooking.Status.BOOKED,
            )
        except IntegrityError as exc:
            # Race: another booked row for this user.
            logger.warning("AuditBooking integrity error user_id=%s", user.pk)
            try:
                _calendar_service().events().delete(
                    calendarId=_calendar_id(),
                    eventId=event_id,
                    sendUpdates="all",
                ).execute()
            except Exception:
                logger.exception("Failed to roll back Google event after IntegrityError")
            raise BookingError("You already have an audit booked.", status=409) from exc

    result = {
        "ok": True,
        "booking_id": booking.pk,
        "slot_start": slot.as_api_dict()["start"],
        "slot_end": slot.as_api_dict()["end"],
        "timezone": display_tz,
        "meet_link": meet_link,
        "google_event_id": event_id,
        "status": AuditBooking.Status.BOOKED,
    }

    # WhatsApp bot (safe no-op if BOOKING_WEBHOOK_URL unset / phone missing).
    # Payload ``name`` is first name only — see booking_webhook.post_booking_webhook.
    try:
        from .booking_webhook import post_booking_webhook

        post_booking_webhook(
            name=user.name or "",
            email=user.email or "",
            phone=user.phone or "",
            meet_link=meet_link,
            slot_start=result["slot_start"],
            slot_end=result["slot_end"],
            timezone=display_tz,
            intake_ref=user.intake_ref or "",
            booking_id=booking.pk,
        )
    except Exception:
        logger.warning("Booking webhook call failed", exc_info=True)

    # Our confirmation email — time always in invitee timezone (not Google's host TZ label).
    try:
        from .booking_mailer import queue_booking_confirmation_email

        queue_booking_confirmation_email(
            to_email=user.email or "",
            full_name=user.name or "",
            slot_start=slot.start,
            slot_end=slot.end,
            timezone_name=display_tz,
            meet_link=meet_link,
        )
    except Exception:
        logger.warning("Booking confirmation email queue failed", exc_info=True)

    return result


def existing_booking_payload(user: User) -> dict | None:
    row = (
        AuditBooking.objects.filter(user=user, status=AuditBooking.Status.BOOKED)
        .order_by("-slot_start")
        .first()
    )
    if not row:
        return None
    return {
        "slot_start": _as_utc(row.slot_start).isoformat().replace("+00:00", "Z"),
        "slot_end": _as_utc(row.slot_end).isoformat().replace("+00:00", "Z"),
        "timezone": row.timezone or (getattr(settings, "BOOKING_TIMEZONE", None) or "Asia/Karachi"),
        "meet_link": row.meet_link or "",
        "status": row.status,
    }
