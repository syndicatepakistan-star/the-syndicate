"""Hunter.io Email Verifier — server-side only. Safe no-op when HUNTER_API_KEY is unset."""

from __future__ import annotations

import logging
import time
from typing import Literal

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

HUNTER_VERIFIER_URL = "https://api.hunter.io/v2/email-verifier"
REQUEST_TIMEOUT_SECONDS = 20
MAX_PENDING_RETRIES = 2
RETRY_SLEEP_SECONDS = 1.25

# Block these statuses for Syn Diagnosis leads.
BLOCK_STATUSES = frozenset({"invalid", "disposable"})
# Allow: valid, webmail, accept_all, unknown (and anything else non-blocked).

HunterVerdict = Literal["allow", "block", "skip"]


def _api_key() -> str:
    return (getattr(settings, "HUNTER_API_KEY", None) or "").strip()


def verify_email_with_hunter(email: str) -> tuple[HunterVerdict, str]:
    """
    Verify email via Hunter Email Verifier API.

    Returns:
      ("allow", "") — email OK (or soft-fail / no key)
      ("block", message) — reject this lead
      ("skip", "") — unused; kept for clarity

    Never raises. Missing key / network / quota → allow (quiz must keep working).
    """
    email_norm = (email or "").strip().lower()
    api_key = _api_key()
    if not api_key or not email_norm:
        return "allow", ""

    params = {"email": email_norm, "api_key": api_key}
    last_status_code: int | None = None

    for attempt in range(MAX_PENDING_RETRIES + 1):
        try:
            response = requests.get(
                HUNTER_VERIFIER_URL,
                params=params,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        except Exception:
            logger.warning("Hunter email verify request failed for %s", email_norm, exc_info=True)
            return "allow", ""

        last_status_code = response.status_code

        if response.status_code == 202:
            if attempt < MAX_PENDING_RETRIES:
                time.sleep(RETRY_SLEEP_SECONDS)
                continue
            logger.info("Hunter verify still pending for %s — allowing", email_norm)
            return "allow", ""

        if response.status_code == 401:
            logger.error("Hunter API key rejected (401) — check HUNTER_API_KEY")
            return "allow", ""

        if response.status_code == 429:
            logger.warning("Hunter rate/quota limited (429) — allowing lead")
            return "allow", ""

        if response.status_code != 200:
            logger.warning(
                "Hunter verify unexpected status=%s body=%s",
                response.status_code,
                (response.text or "")[:200],
            )
            return "allow", ""

        try:
            payload = response.json()
        except Exception:
            logger.warning("Hunter verify invalid JSON for %s", email_norm)
            return "allow", ""

        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, dict):
            return "allow", ""

        status = str(data.get("status") or "").strip().lower()
        if status in BLOCK_STATUSES:
            if status == "disposable":
                return "block", "Please use a permanent email (not a temporary inbox)."
            return "block", "Please enter a real, deliverable email address."

        # valid / webmail / accept_all / unknown / …
        logger.info(
            "Hunter verify ok email=%s status=%s score=%s",
            email_norm,
            status or "?",
            data.get("score"),
        )
        return "allow", ""

    logger.warning("Hunter verify exhausted retries status=%s — allowing", last_status_code)
    return "allow", ""
