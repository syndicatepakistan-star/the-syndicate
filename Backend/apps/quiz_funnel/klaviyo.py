"""Push Syn Diagnosis quiz emails into a Klaviyo list (marketing sequence)."""

from __future__ import annotations

import logging
import re
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

KLAVIYO_REVISION = "2024-10-15"
SUBSCRIBE_URL = "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/"
PROFILE_IMPORT_URL = "https://a.klaviyo.com/api/profile-import/"


def _headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Klaviyo-API-Key {api_key}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "revision": KLAVIYO_REVISION,
    }


def _split_name(full_name: str) -> tuple[str, str]:
    parts = (full_name or "").strip().split(None, 1)
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]


def normalize_phone_e164(raw: str) -> str:
    """
    Quiz sends e.g. '+92 3001234567' or '+1-684 7123456789'.
    Klaviyo profile phone_number must be E.164: + then digits only (6–15 digits).
    """
    digits = re.sub(r"\D", "", (raw or "").strip())
    if len(digits) < 6 or len(digits) > 15:
        return ""
    return f"+{digits}"


def subscribe_syn_diagnosis_email(
    *,
    email: str,
    name: str = "",
    phone: str = "",
    properties: dict[str, Any] | None = None,
) -> bool:
    """
    Create/update the Klaviyo profile and subscribe them to the Syn Diagnosis list.

    Safe no-op when KLAVIYO_PRIVATE_API_KEY or KLAVIYO_SYN_DIAGNOSIS_LIST_ID is unset.
    Never raises — quiz submit must succeed even if Klaviyo is down.
    """
    api_key = (getattr(settings, "KLAVIYO_PRIVATE_API_KEY", "") or "").strip()
    list_id = (getattr(settings, "KLAVIYO_SYN_DIAGNOSIS_LIST_ID", "") or "").strip()
    email_norm = (email or "").strip().lower()
    if not api_key or not list_id or not email_norm:
        return False

    first_name, last_name = _split_name(name)
    phone_e164 = normalize_phone_e164(phone)
    props: dict[str, Any] = {
        "source": "syn_diagnosis_quiz",
        **(properties or {}),
    }
    if phone_e164:
        props.setdefault("phone_raw", phone_e164)
    # Drop empty custom props so Klaviyo stays clean.
    props = {k: v for k, v in props.items() if v is not None and str(v).strip() != ""}

    headers = _headers(api_key)
    timeout = 8

    try:
        profile_attrs: dict[str, Any] = {
            "email": email_norm,
            "properties": props,
        }
        if first_name:
            profile_attrs["first_name"] = first_name
        if last_name:
            profile_attrs["last_name"] = last_name
        if phone_e164:
            profile_attrs["phone_number"] = phone_e164

        import_res = requests.post(
            PROFILE_IMPORT_URL,
            headers=headers,
            json={
                "data": {
                    "type": "profile",
                    "attributes": profile_attrs,
                }
            },
            timeout=timeout,
        )
        if import_res.status_code >= 400:
            logger.warning(
                "Klaviyo profile-import failed for %s: %s %s",
                email_norm,
                import_res.status_code,
                (import_res.text or "")[:300],
            )

        subscribe_profile_attrs: dict[str, Any] = {
            "email": email_norm,
            "subscriptions": {
                "email": {
                    "marketing": {
                        "consent": "SUBSCRIBED",
                    }
                }
            },
        }
        if phone_e164:
            subscribe_profile_attrs["phone_number"] = phone_e164

        subscribe_body = {
            "data": {
                "type": "profile-subscription-bulk-create-job",
                "attributes": {
                    "profiles": {
                        "data": [
                            {
                                "type": "profile",
                                "attributes": subscribe_profile_attrs,
                            }
                        ]
                    }
                },
                "relationships": {
                    "list": {
                        "data": {
                            "type": "list",
                            "id": list_id,
                        }
                    }
                },
            }
        }
        sub_res = requests.post(
            SUBSCRIBE_URL,
            headers=headers,
            json=subscribe_body,
            timeout=timeout,
        )
        if sub_res.status_code >= 400:
            logger.warning(
                "Klaviyo list subscribe failed for %s: %s %s",
                email_norm,
                sub_res.status_code,
                (sub_res.text or "")[:300],
            )
            return False
        return True
    except Exception:
        logger.exception("Klaviyo Syn Diagnosis sync failed for %s", email_norm)
        return False
