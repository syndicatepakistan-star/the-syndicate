from __future__ import annotations

from django.utils import timezone

# Statuses that mean the wire/payout was sent (admin may use any of these labels).
TRANSFERRED_WITHDRAWAL_STATUSES = frozenset(
    {
        "complete",
        "completed",
        "transferred",
        "paid",
        "wire_sent",
        "sent",
        "payout_sent",
    }
)

REFUNDED_WITHDRAWAL_STATUSES = frozenset({"rejected", "cancelled", "denied", "refunded", "failed"})

WITHDRAWAL_STATUS_CHOICES = [
    ("pending", "Pending review"),
    ("approved", "Approved (awaiting wire)"),
    ("transferred", "Transferred (wire sent)"),
    ("rejected", "Rejected"),
    ("cancelled", "Cancelled"),
]


def is_transferred_withdrawal_status(raw: str | None) -> bool:
    return (raw or "").strip().lower() in TRANSFERRED_WITHDRAWAL_STATUSES


def ensure_withdrawal_transferred_fields(*, status: str, transferred_at, old_status: str | None = None):
    """
    When status is a paid-out label, ensure transferred_at is set.
    Returns (possibly normalized status, transferred_at).
    """
    new_status = (status or "pending").strip().lower() or "pending"
    if is_transferred_withdrawal_status(new_status):
        if not transferred_at:
            transferred_at = timezone.now()
        # Canonical label for admin dropdown + API consistency.
        if new_status != "transferred":
            new_status = "transferred"
    return new_status, transferred_at
