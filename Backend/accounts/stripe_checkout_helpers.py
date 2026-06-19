"""Stripe Checkout session helpers (Knight subscription vs one-time plans)."""

from __future__ import annotations

_KNIGHT_PLANS = frozenset({"king", "knight"})


def is_knight_subscription_plan(plan_raw: str) -> bool:
    return (plan_raw or "").strip().lower() in _KNIGHT_PLANS


def checkout_session_is_paid(session) -> bool:
    status = str(getattr(session, "payment_status", "") or "").lower()
    if status == "paid":
        return True
    if str(getattr(session, "mode", "") or "").lower() == "subscription":
        return status in ("paid", "no_payment_required")
    return False


def build_checkout_line_items(*, plan_raw: str, product_name: str, unit_amount: int, currency: str) -> list[dict]:
    price_data = {
        "currency": currency,
        "product_data": {"name": product_name},
        "unit_amount": unit_amount,
    }
    if is_knight_subscription_plan(plan_raw):
        price_data["recurring"] = {"interval": "month"}
    return [{"price_data": price_data, "quantity": 1}]


def checkout_session_mode(plan_raw: str) -> str:
    return "subscription" if is_knight_subscription_plan(plan_raw) else "payment"
