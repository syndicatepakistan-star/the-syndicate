"""Outbound Syn Diagnosis lead webhook (WhatsApp bot / n8n). Safe no-op when unset or on failure."""

from __future__ import annotations

import logging
import threading

import requests
from django.conf import settings
from django.core.cache import cache

from .booking_mailer import first_name_from

logger = logging.getLogger(__name__)

WEBHOOK_TIMEOUT_SECONDS = 4
# Prevent triple Completed WhatsApp when submit is retried / raced.
COMPLETED_WEBHOOK_DEDUPE_SECONDS = 120
_claim_lock = threading.Lock()


def _completed_dedupe_key(*, email: str, phone: str, user_pk: int | None = None) -> str:
    email_norm = (email or "").strip().lower()
    phone_norm = "".join(ch for ch in (phone or "") if ch.isdigit())
    if user_pk is not None:
        return f"lead_webhook:completed:user:{user_pk}"
    return f"lead_webhook:completed:{email_norm}:{phone_norm}"


def claim_completed_webhook_once(
    *,
    email: str,
    phone: str = "",
    user_pk: int | None = None,
    ttl_seconds: int = COMPLETED_WEBHOOK_DEDUPE_SECONDS,
) -> bool:
    """
    Return True only for the first Completed webhook claim within ``ttl_seconds``.

    Uses cache.add (atomic when Redis/Memcached is configured) plus a process lock
    so parallel submit threads on one worker cannot all fire WhatsApp.
    """
    key = _completed_dedupe_key(email=email, phone=phone, user_pk=user_pk)
    ttl = max(30, int(ttl_seconds or COMPLETED_WEBHOOK_DEDUPE_SECONDS))
    with _claim_lock:
        try:
            claimed = bool(cache.add(key, "1", timeout=ttl))
        except Exception:
            logger.warning("Completed webhook cache claim failed; allowing send", exc_info=True)
            return True
    if not claimed:
        logger.info(
            "Completed lead webhook deduped email=%s user_pk=%s",
            (email or "").strip().lower(),
            user_pk,
        )
    return claimed


def post_lead_webhook(
    *,
    name: str,
    email: str,
    phone: str,
    intake_url: str = "",
    diagnosis: str = "Not Completed",
    sheet_only: bool = False,
    source: str = "syn_diagnosis_quiz",
    timeout: float | None = None,
    user_pk: int | None = None,
    skip_completed_dedupe: bool = False,
) -> bool:
    """
    POST name/email/phone (+ optional intake_url, diagnosis) to LEAD_WEBHOOK_URL
    when a quiz lead has a phone.

    ``name`` is first name only (WhatsApp greeting for the intake/audit link message).
    Full name is also sent as ``full_name``.
    ``diagnosis`` is ``Completed`` when the quiz Result exists, else ``Not Completed``.
    ``sheet_only`` tells Bot A to update the Leads sheet only (no WhatsApp).

    For ``Completed``, only the first call within ~2 minutes is sent (dedupe),
    unless ``skip_completed_dedupe`` is True (admin/bulk tools).

    Safe no-op when LEAD_WEBHOOK_URL or phone is empty.
    Never raises — quiz lead save must succeed even if the webhook is down.
    """
    url = (getattr(settings, "LEAD_WEBHOOK_URL", "") or "").strip()
    # Guard against pasting "LEAD_WEBHOOK_URL=https://..." into the value field.
    if url.upper().startswith("LEAD_WEBHOOK_URL="):
        url = url.split("=", 1)[1].strip()
    phone_norm = (phone or "").strip()
    email_norm = (email or "").strip().lower()
    if not url:
        return False
    if not phone_norm and not (sheet_only and email_norm):
        return False
    if not url.startswith(("http://", "https://")):
        logger.warning("LEAD_WEBHOOK_URL is not a valid http(s) URL: %r", url)
        return False

    full_name = (name or "").strip()
    first = first_name_from(full_name) or full_name
    diagnosis_norm = (
        diagnosis if diagnosis in ("Completed", "Not Completed") else "Not Completed"
    )

    if (
        diagnosis_norm == "Completed"
        and not sheet_only
        and not skip_completed_dedupe
        and not claim_completed_webhook_once(
            email=email_norm,
            phone=phone_norm,
            user_pk=user_pk,
        )
    ):
        return False

    payload = {
        # Greeting field — first name only (same fix as booking WhatsApp).
        "name": first,
        "first_name": first,
        "full_name": full_name,
        "email": email_norm,
        "phone": phone_norm,
        "source": (source or "syn_diagnosis_quiz").strip() or "syn_diagnosis_quiz",
        "diagnosis": diagnosis_norm,
        "sheet_only": bool(sheet_only),
    }
    intake = (intake_url or "").strip()
    if intake:
        payload["intake_url"] = intake

    try:
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=float(timeout if timeout is not None else WEBHOOK_TIMEOUT_SECONDS),
        )
        if 200 <= response.status_code < 300:
            return True
        logger.warning(
            "Lead webhook non-2xx status=%s url=%s",
            response.status_code,
            url,
        )
        return False
    except Exception:
        logger.warning("Lead webhook failed", exc_info=True)
        return False
