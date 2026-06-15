"""Record affiliate sales when Stripe checkout completes (server-side, idempotent)."""

from __future__ import annotations

import logging
from decimal import Decimal, InvalidOperation

from apps.affiliate_tracking.models import ClickEvent, LeadEvent, SaleEvent, SectionReferral
from apps.affiliate_tracking.views import (
    DEFAULT_LEAD_LABELS,
    LEAD_KIND_AUTH,
    SALE_POINTS_PER_DOLLAR,
    _commission_amount_for_purchase,
    _get_referral_or_400,
)

logger = logging.getLogger(__name__)

_SESSION_PREFIX = "stripe_session:"


def record_sale_from_checkout_metadata(
    *,
    session_id: str,
    affiliate_id: str,
    visitor_id: str,
    email: str,
    purchase_amount: float | Decimal,
    currency: str = "usd",
    plan_label: str = "",
) -> bool:
    """
    Credit affiliate commission from paid checkout metadata.
    Idempotent per Stripe session id so frontend trackSale retries do not double-count.
    """
    aid = (affiliate_id or "").strip()
    vid = (visitor_id or "").strip()
    buyer_email = (email or "").strip().lower()
    sid = (session_id or "").strip()
    if not aid or not vid or not buyer_email or not sid:
        return False

    try:
        amount = Decimal(str(purchase_amount))
    except (InvalidOperation, TypeError, ValueError):
        return False
    if amount <= 0:
        return False

    referral = _get_referral_or_400(aid)
    if referral is None:
        logger.warning("Checkout sale attribution skipped: affiliate_id=%s not found", aid)
        return False

    marker = f"{_SESSION_PREFIX}{sid}"
    if SaleEvent.objects.filter(referral=referral, subscription_name__startswith=marker).exists():
        return False

    ClickEvent.objects.get_or_create(referral=referral, visitor_id=vid)
    LeadEvent.objects.get_or_create(
        referral=referral,
        visitor_id=vid,
        lead_kind=LEAD_KIND_AUTH,
        defaults={"email": buyer_email, "lead_label": DEFAULT_LEAD_LABELS[LEAD_KIND_AUTH]},
    )

    plan_part = (plan_label or "checkout-purchase").strip()
    subscription_name = f"{marker}|{plan_part}"[:280]
    commission_amount = _commission_amount_for_purchase(amount)
    cur = (currency or "usd").strip().lower()[:8] or "usd"

    SaleEvent.objects.create(
        referral=referral,
        visitor_id=vid,
        email=buyer_email,
        amount=commission_amount,
        purchase_amount=amount,
        subscription_name=subscription_name,
        currency=cur,
    )
    referral.profile.points_total += int(amount) * SALE_POINTS_PER_DOLLAR
    referral.profile.save(update_fields=["points_total"])
    return True
