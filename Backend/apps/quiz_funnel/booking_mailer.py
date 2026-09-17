"""Audit booking confirmation email — time always in the invitee's selected timezone."""

from __future__ import annotations

import logging
import threading
from datetime import datetime
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import connection
from django.utils.html import escape

from accounts.syndicate_otp_mailer import send_syndicate_otp_html_email

logger = logging.getLogger(__name__)


def first_name_from(full_name: str) -> str:
    parts = (full_name or "").strip().split(None, 1)
    return parts[0] if parts else ""


def _safe_zone(name: str) -> ZoneInfo:
    raw = (name or "").strip() or "UTC"
    try:
        return ZoneInfo(raw)
    except Exception:
        return ZoneInfo("UTC")


def format_slot_in_timezone(
    slot_start: datetime,
    slot_end: datetime,
    timezone_name: str,
) -> str:
    """
    Human line for emails / WhatsApp, always in the guest's IANA zone
    (e.g. Europe/London), not the host calendar default.
    """
    tz_name = (timezone_name or "").strip() or "UTC"
    tz = _safe_zone(tz_name)
    start = slot_start.astimezone(tz)
    end = slot_end.astimezone(tz)
    day = start.strftime("%A, %d %B %Y")
    t0 = start.strftime("%I:%M %p").lstrip("0")
    t1 = end.strftime("%I:%M %p").lstrip("0")
    label = tz_name.replace("_", " ")
    abbr = start.tzname() or ""
    if abbr and abbr not in label:
        return f"{day} · {t0} – {t1} ({label} · {abbr})"
    return f"{day} · {t0} – {t1} ({label})"


def build_booking_confirmation_html(
    *,
    first_name: str,
    local_when: str,
    meet_link: str,
    timezone_name: str,
) -> str:
    greet = f"Hi {escape(first_name)}," if first_name else "Hi,"
    when = escape(local_when)
    tz = escape((timezone_name or "").replace("_", " "))
    link = escape(meet_link)
    return f"""
  <div style="margin:0;padding:34px 16px;background:#020305;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#d8e5f2;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #cda936;border-radius:16px;background:#070a10;overflow:hidden;">
      <div style="padding:20px 24px 16px;border-bottom:1px solid #cda936;">
        <div style="font-size:11px;letter-spacing:1.7px;color:#fde68a;text-transform:uppercase;">Founder Audit</div>
        <div style="margin-top:10px;font-size:28px;font-weight:800;color:#facc15;text-transform:uppercase;">The Syndicate</div>
      </div>
      <div style="padding:26px;">
        <p style="margin:0 0 12px;font-size:15px;color:#c7d8e8;">{greet}</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#b8c9dc;">
          Your founder audit call is booked. The time below is shown in
          <strong style="color:#f8fafc;">your selected timezone</strong> ({tz}).
        </p>
        <div style="margin:0 0 18px;padding:16px;border:1px solid #cda936;border-radius:12px;background:rgba(9,18,28,0.96);">
          <div style="font-size:11px;letter-spacing:1.5px;color:#7ddbf4;text-transform:uppercase;">When</div>
          <div style="margin-top:8px;font-size:17px;font-weight:700;color:#facc15;line-height:1.4;">{when}</div>
        </div>
        <p style="margin:0 0 10px;font-size:14px;color:#c7d8e8;">
          Join with Google Meet:
        </p>
        <p style="margin:0 0 18px;">
          <a href="{link}" style="color:#67e8f9;word-break:break-all;">{link}</a>
        </p>
        <p style="margin:0;font-size:12px;line-height:1.65;color:#70839a;">
          This is your booking confirmation. The time above is in the timezone you selected
          when you booked.
        </p>
      </div>
    </div>
  </div>
  """


def send_booking_confirmation_email(
    *,
    to_email: str,
    full_name: str,
    slot_start: datetime,
    slot_end: datetime,
    timezone_name: str,
    meet_link: str,
) -> None:
    email = (to_email or "").strip().lower()
    meet = (meet_link or "").strip()
    if not email or not meet:
        return

    first = first_name_from(full_name)
    local_when = format_slot_in_timezone(slot_start, slot_end, timezone_name)
    subject = f"Your founder audit is booked — {local_when}"
    html = build_booking_confirmation_html(
        first_name=first,
        local_when=local_when,
        meet_link=meet,
        timezone_name=timezone_name,
    )
    send_syndicate_otp_html_email(email, subject, html)


def queue_booking_confirmation_email(
    *,
    to_email: str,
    full_name: str,
    slot_start: datetime,
    slot_end: datetime,
    timezone_name: str,
    meet_link: str,
) -> None:
    """Fire-and-forget after booking succeeds (never block the book API)."""

    def _deliver() -> None:
        connection.close()
        try:
            send_booking_confirmation_email(
                to_email=to_email,
                full_name=full_name,
                slot_start=slot_start,
                slot_end=slot_end,
                timezone_name=timezone_name,
                meet_link=meet_link,
            )
        except Exception:
            logger.exception("Booking confirmation email failed for %s", to_email)

    threading.Thread(
        target=_deliver,
        name="audit-booking-mail",
        daemon=True,
    ).start()
