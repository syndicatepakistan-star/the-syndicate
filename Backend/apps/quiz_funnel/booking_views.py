"""HTTP endpoints for founder audit slot listing + booking."""

from __future__ import annotations

import json
import logging

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .calendar_service import (
    BookingError,
    book_slot,
    existing_booking_payload,
    list_available_slots,
)
from .views import _resolve_intake_user

logger = logging.getLogger(__name__)


def _require_intake_user(ref: str = "", email: str = ""):
    user = _resolve_intake_user(ref=ref, email=email)
    if user is None:
        return None, JsonResponse({"ok": False, "error": "Invalid or expired link."}, status=404)
    if not (hasattr(user, "intake") and user.intake is not None):
        return None, JsonResponse(
            {
                "ok": False,
                "error": "Please submit your intake answers before booking an audit.",
            },
            status=400,
        )
    return user, None


@require_GET
def list_booking_slots(request):
    """
    GET /api/booking/slots?ref=...&email=...
    """
    ref = (request.GET.get("ref") or "").strip()
    email = (request.GET.get("email") or "").strip()
    user, err = _require_intake_user(ref=ref, email=email)
    if err is not None:
        return err

    existing = existing_booking_payload(user)
    if existing:
        return JsonResponse(
            {
                "ok": True,
                "timezone": existing.get("timezone") or "Asia/Karachi",
                "slots": [],
                "existing_booking": existing,
            }
        )

    try:
        tz_name, slots = list_available_slots()
    except BookingError as exc:
        return JsonResponse({"ok": False, "error": exc.message, "slots": []}, status=exc.status)
    except Exception:
        logger.exception("list_booking_slots failed")
        return JsonResponse(
            {"ok": False, "error": "Could not load available times.", "slots": []},
            status=500,
        )

    return JsonResponse(
        {
            "ok": True,
            "timezone": tz_name,
            "slots": [slot.as_api_dict() for slot in slots],
            "existing_booking": None,
        }
    )


@csrf_exempt
@require_POST
def book_audit_slot(request):
    """
    POST /api/booking/book
    Body: { ref?, email?, slot_start, slot_end }
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"ok": False, "error": "Invalid JSON payload."}, status=400)

    ref = str(payload.get("ref") or "").strip()
    email = str(payload.get("email") or "").strip()
    slot_start = str(payload.get("slot_start") or "").strip()
    slot_end = str(payload.get("slot_end") or "").strip()

    user, err = _require_intake_user(ref=ref, email=email)
    if err is not None:
        return err

    if not slot_start or not slot_end:
        return JsonResponse({"ok": False, "error": "Please select a time slot."}, status=400)

    try:
        result = book_slot(user, slot_start, slot_end)
    except BookingError as exc:
        return JsonResponse({"ok": False, "error": exc.message}, status=exc.status)
    except Exception:
        logger.exception("book_audit_slot failed user_id=%s", getattr(user, "pk", None))
        return JsonResponse(
            {"ok": False, "error": "Could not complete booking. Please try again."},
            status=500,
        )

    return JsonResponse(result)
