"""Outbound audit booking webhook (WhatsApp bot). Safe no-op when unset or on failure."""

from __future__ import annotations

import logging

import requests
from django.conf import settings

from .booking_mailer import first_name_from

logger = logging.getLogger(__name__)

WEBHOOK_TIMEOUT_SECONDS = 8


def post_booking_webhook(
    *,
    name: str,
    email: str,
    phone: str,
    meet_link: str,
    slot_start: str,
    slot_end: str,
    timezone: str = "Asia/Karachi",
    intake_ref: str = "",
    booking_id: int | None = None,
) -> bool:
    """
    POST booking details to BOOKING_WEBHOOK_URL after a successful audit book.

    ``name`` is the first name only (WhatsApp greeting). Full name is also sent
    as ``full_name`` for bots that need it.

    Safe no-op when URL or phone is empty.
    Never raises — booking must succeed even if WhatsApp bot is down.
    """
    url = (getattr(settings, "BOOKING_WEBHOOK_URL", None) or "").strip()
    phone_norm = (phone or "").strip()
    meet = (meet_link or "").strip()
    if not url or not phone_norm or not meet:
        return False

    full_name = (name or "").strip()
    first = first_name_from(full_name) or full_name

    payload = {
        # Primary greeting field — first name only (fixes "Thomas Muller" → "Thomas").
        "name": first,
        "first_name": first,
        "full_name": full_name,
        "email": (email or "").strip().lower(),
        "phone": phone_norm,
        "meet_link": meet,
        "slot_start": (slot_start or "").strip(),
        "slot_end": (slot_end or "").strip(),
        "timezone": (timezone or "Asia/Karachi").strip(),
        "source": "audit_booking",
    }
    ref = (intake_ref or "").strip()
    if ref:
        payload["intake_ref"] = ref
    if booking_id is not None:
        payload["booking_id"] = booking_id

    headers = {"Content-Type": "application/json"}
    secret = (getattr(settings, "BOOKING_WEBHOOK_SECRET", None) or "").strip()
    if secret:
        headers["X-Webhook-Secret"] = secret

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=WEBHOOK_TIMEOUT_SECONDS,
        )
        if 200 <= response.status_code < 300:
            return True
        logger.warning(
            "Booking webhook non-2xx status=%s url=%s",
            response.status_code,
            url,
        )
        return False
    except Exception:
        logger.warning("Booking webhook failed", exc_info=True)
        return False
