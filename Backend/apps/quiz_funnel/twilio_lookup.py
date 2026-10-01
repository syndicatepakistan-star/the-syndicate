"""Twilio Lookup v2 — server-side phone check. Safe no-op when unset / disabled."""

from __future__ import annotations

import logging
from typing import Literal
from urllib.parse import quote

import requests
from django.conf import settings

from .phone_junk import junk_phone_error, national_digits_only

logger = logging.getLogger(__name__)

LOOKUP_URL = "https://lookups.twilio.com/v2/PhoneNumbers/{phone}"
REQUEST_TIMEOUT_SECONDS = 8

# Block these line types by default (WhatsApp needs mobile).
DEFAULT_BLOCK_LINE_TYPES = frozenset(
    {
        "landline",
        "fixedvoip",
        "nonfixedvoip",
        "tollfree",
        "premium",
        "sharedcost",
        "uan",
        "voicemail",
        "pager",
    }
)

LookupVerdict = Literal["allow", "block"]


def _enabled() -> bool:
    raw = str(getattr(settings, "TWILIO_LOOKUP_ENABLED", "") or "").strip().lower()
    if raw in {"0", "false", "no", "off"}:
        return False
    # Default on when credentials exist, unless explicitly disabled.
    if raw in {"1", "true", "yes", "on"}:
        return True
    sid = (getattr(settings, "TWILIO_ACCOUNT_SID", None) or "").strip()
    token = (getattr(settings, "TWILIO_AUTH_TOKEN", None) or "").strip()
    return bool(sid and token)


def _credentials() -> tuple[str, str]:
    sid = (getattr(settings, "TWILIO_ACCOUNT_SID", None) or "").strip()
    token = (getattr(settings, "TWILIO_AUTH_TOKEN", None) or "").strip()
    return sid, token


def _normalize_e164(phone: str) -> str:
    text = (phone or "").strip()
    if not text:
        return ""
    if text.startswith("+"):
        digits = national_digits_only(text)
        return f"+{digits}" if digits else ""
    digits = national_digits_only(text)
    return f"+{digits}" if digits else ""


def verify_phone_with_twilio_lookup(phone: str) -> tuple[LookupVerdict, str]:
    """
    Validate phone via junk filters + Twilio Lookup Line Type Intelligence.

    Returns:
      ("allow", "") — OK, or soft-fail (no creds / network / disabled)
      ("block", message) — reject this lead

    Never raises.
    """
    e164 = _normalize_e164(phone)
    if not e164:
        return "block", "Please enter a valid phone number."

    junk = junk_phone_error(e164)
    if junk:
        return "block", junk

    if not _enabled():
        return "allow", ""

    sid, token = _credentials()
    if not sid or not token:
        return "allow", ""

    url = LOOKUP_URL.format(phone=quote(e164, safe="+"))
    try:
        response = requests.get(
            url,
            params={"Fields": "line_type_intelligence"},
            auth=(sid, token),
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except Exception:
        logger.warning("Twilio Lookup request failed for %s", e164, exc_info=True)
        return "allow", ""

    if response.status_code in {401, 403}:
        logger.error("Twilio Lookup auth failed status=%s — check TWILIO_ACCOUNT_SID / AUTH_TOKEN", response.status_code)
        return "allow", ""

    if response.status_code == 429:
        logger.warning("Twilio Lookup rate limited (429) — allowing lead")
        return "allow", ""

    if response.status_code == 404:
        return "block", "Please enter a valid phone number."

    if response.status_code != 200:
        logger.warning(
            "Twilio Lookup unexpected status=%s body=%s",
            response.status_code,
            (response.text or "")[:200],
        )
        return "allow", ""

    try:
        data = response.json()
    except Exception:
        logger.warning("Twilio Lookup invalid JSON for %s", e164)
        return "allow", ""

    if not isinstance(data, dict):
        return "allow", ""

    # Valid false / missing calling country → treat as bad number when provided.
    if data.get("valid") is False:
        return "block", "Please enter a valid phone number for the selected country."

    lti = data.get("line_type_intelligence")
    if not isinstance(lti, dict):
        # Package may be unavailable on trial — don't hard-block.
        logger.info("Twilio Lookup ok phone=%s (no line_type_intelligence field)", e164)
        return "allow", ""

    line_type = str(lti.get("type") or lti.get("line_type") or "").strip().lower()
    if not line_type or line_type == "unknown":
        logger.info("Twilio Lookup unknown line type phone=%s — allowing", e164)
        return "allow", ""

    allow_landline = str(getattr(settings, "TWILIO_LOOKUP_ALLOW_LANDLINE", "") or "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    allow_voip = str(getattr(settings, "TWILIO_LOOKUP_ALLOW_VOIP", "") or "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    block_types = set(DEFAULT_BLOCK_LINE_TYPES)
    if allow_landline:
        block_types.discard("landline")
    if allow_voip:
        block_types.discard("fixedvoip")
        block_types.discard("nonfixedvoip")

    if line_type in block_types:
        if line_type == "landline":
            return "block", "Please use a mobile number (landlines are not supported)."
        if "voip" in line_type:
            return "block", "Please use a real mobile number (not a VoIP / virtual number)."
        return "block", "Please use a valid mobile phone number."

    logger.info("Twilio Lookup ok phone=%s line_type=%s", e164, line_type)
    return "allow", ""
