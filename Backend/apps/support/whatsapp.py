"""Send support confirmation to the user's WhatsApp via Whapi (safe no-op)."""

from __future__ import annotations

import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

WHAPI_TIMEOUT_SECONDS = 8


def support_user_message(*, priority: str, is_follow_up: bool = False) -> str:
    label = {
        "critical": "URGENT",
        "elevated": "HIGH PRIORITY",
        "normal": "STANDARD",
    }.get((priority or "").strip().lower(), (priority or "STANDARD").upper())
    kind = "support reply" if is_follow_up else "support request"
    return (
        f"We received your {kind}. Your request with ({label}) is in our queue. "
        "Check dashboard Support for replies on the same chat."
    )


def normalize_whapi_phone(raw: str) -> str:
    """Whapi expects digits with country code, no plus/spaces."""
    digits = re.sub(r"\D", "", (raw or "").strip())
    if len(digits) < 8 or len(digits) > 15:
        return ""
    return digits


def resolve_user_whatsapp_phone(user) -> str:
    """
    Find a registered phone for the logged-in operator.
    Prefer quiz funnel lead phone (matched by email), then any phone-like attrs.
    """
    email = (getattr(user, "email", None) or "").strip().lower()
    if email:
        try:
            from apps.quiz_funnel.models import User as QuizUser

            quiz = (
                QuizUser.objects.filter(email__iexact=email)
                .exclude(phone__isnull=True)
                .exclude(phone="")
                .order_by("-id")
                .first()
            )
            if quiz:
                phone = normalize_whapi_phone(getattr(quiz, "phone", "") or "")
                if phone:
                    return phone
        except Exception:
            logger.warning("Support WhatsApp phone lookup (quiz) failed", exc_info=True)

    for attr in ("phone", "phone_number", "mobile", "whatsapp"):
        phone = normalize_whapi_phone(getattr(user, attr, None) or "")
        if phone:
            return phone

    return ""


def send_support_whatsapp_confirmation(
    *,
    phone: str,
    priority: str,
    is_follow_up: bool = False,
) -> bool:
    """
    Send confirmation text via Whapi.
    No-op when phone or WHAPI_TOKEN is missing. Never raises.
    """
    to = normalize_whapi_phone(phone)
    token = (getattr(settings, "WHAPI_TOKEN", None) or "").strip()
    api_base = (getattr(settings, "WHAPI_API_URL", None) or "https://gate.whapi.cloud/").strip()
    if not to or not token:
        return False

    base = api_base.rstrip("/") + "/"
    url = f"{base}messages/text"
    body = support_user_message(priority=priority, is_follow_up=is_follow_up)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"to": to, "body": body}

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=WHAPI_TIMEOUT_SECONDS,
        )
        if 200 <= response.status_code < 300:
            return True
        logger.warning(
            "Support Whapi non-2xx status=%s phone=%s body=%s",
            response.status_code,
            to[-4:].rjust(len(to), "*"),
            (response.text or "")[:200],
        )
        return False
    except Exception:
        logger.warning("Support Whapi send failed", exc_info=True)
        return False
