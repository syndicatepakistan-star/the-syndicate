"""Resolve Stripe checkout currency: UK IP or UK phone → gbp, otherwise usd."""

from __future__ import annotations

import re

from django.conf import settings

ALLOWED_CHECKOUT_CURRENCIES = frozenset({"usd", "gbp"})


def _request_country(request) -> str:
  if request is None:
    return ""
  meta = getattr(request, "META", {}) or {}
  for key in (
    "HTTP_CF_IPCOUNTRY",
    "HTTP_X_VERCEL_IP_COUNTRY",
    "HTTP_CLOUDFRONT_VIEWER_COUNTRY",
    "HTTP_X_COUNTRY_CODE",
    "HTTP_X_GEO_COUNTRY",
  ):
    raw = str(meta.get(key) or "").strip().upper()
    if raw and raw not in ("XX", "T1", "UNKNOWN"):
      return raw
  return ""


def _is_uk_phone(value: str) -> bool:
  raw = re.sub(r"[\s()\-]", "", str(value or "").strip())
  if not raw:
    return False
  if raw in ("+44", "44"):
    return True
  if raw.startswith("+44") or raw.startswith("0044"):
    return True
  return bool(re.match(r"^0?7\d{9}$", raw))


def resolve_checkout_currency(request=None, payload: dict | None = None) -> str:
  """
  Prefer explicit payload currency (usd|gbp), then UK phone, then UK IP country.
  Falls back to settings.DEFAULT_CURRENCY (usd).
  """
  data = payload if isinstance(payload, dict) else {}
  explicit = str(data.get("currency") or "").strip().lower()
  if explicit in ALLOWED_CHECKOUT_CURRENCIES:
    return explicit

  for key in ("phone", "customer_phone", "lead_phone"):
    if _is_uk_phone(str(data.get(key) or "")):
      return "gbp"

  if _request_country(request) == "GB":
    return "gbp"

  default = str(getattr(settings, "DEFAULT_CURRENCY", "usd") or "usd").strip().lower()
  if default in ALLOWED_CHECKOUT_CURRENCIES:
    return default
  return "usd"
