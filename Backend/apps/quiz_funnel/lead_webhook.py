"""Outbound Syn Diagnosis lead webhook (WhatsApp bot / n8n). Safe no-op when unset or on failure."""

from __future__ import annotations

import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

WEBHOOK_TIMEOUT_SECONDS = 4


def post_lead_webhook(
    *,
    name: str,
    email: str,
    phone: str,
    intake_url: str = "",
) -> bool:
    """
    POST name/email/phone (+ optional intake_url) to LEAD_WEBHOOK_URL when a quiz lead has a phone.

    Safe no-op when LEAD_WEBHOOK_URL or phone is empty.
    Never raises — quiz lead save must succeed even if the webhook is down.
    """
    url = (getattr(settings, "LEAD_WEBHOOK_URL", "") or "").strip()
    phone_norm = (phone or "").strip()
    if not url or not phone_norm:
        return False

    payload = {
        "name": (name or "").strip(),
        "email": (email or "").strip().lower(),
        "phone": phone_norm,
        "source": "syn_diagnosis_quiz",
    }
    intake = (intake_url or "").strip()
    if intake:
        payload["intake_url"] = intake

    try:
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=WEBHOOK_TIMEOUT_SECONDS,
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
