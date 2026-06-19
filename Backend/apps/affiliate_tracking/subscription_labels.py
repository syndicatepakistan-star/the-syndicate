"""Human-readable subscription / product labels for affiliate sale rows."""

from __future__ import annotations

_STRIPE_SESSION_PREFIX = "stripe_session:"


def display_subscription_name(raw: str) -> str:
    """Strip legacy `stripe_session:…|Product title` storage; return title only."""
    name = (raw or "").strip()
    if not name:
        return ""
    if name.startswith(_STRIPE_SESSION_PREFIX):
        if "|" in name:
            return name.split("|", 1)[1].strip()
        return ""
    return name


def join_display_subscription_names(raw_names: list[str]) -> str:
    """Deduped, cleaned labels joined for the affiliate dashboard."""
    seen: set[str] = set()
    parts: list[str] = []
    for raw in raw_names:
        for segment in (raw or "").split("·"):
            cleaned = display_subscription_name(segment)
            key = cleaned.lower()
            if cleaned and key not in seen:
                seen.add(key)
                parts.append(cleaned)
    return " · ".join(parts)[:280]
