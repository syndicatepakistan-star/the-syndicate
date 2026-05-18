from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.portal.permissions import IsAuthenticatedStrict

from .mailer import send_support_staff_alert, send_support_user_confirmation
from .models import SupportMessage, SupportThread

MIN_MESSAGE_LEN = 12
MAX_MESSAGE_LEN = 4000
COOLDOWN_MINUTES = 5
CRITICAL_DAILY_LIMIT = 3


def _bad_request(detail: str) -> Response:
    return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)


def _user_display(user) -> str:
    name = (getattr(user, "first_name", None) or "").strip()
    if name:
        return name
    email = (getattr(user, "email", None) or "").strip()
    if email and "@" in email:
        return email.split("@")[0]
    return getattr(user, "username", None) or "Operator"


def _serialize_message(msg: SupportMessage) -> dict:
    return {
        "id": str(msg.id),
        "body": msg.body,
        "is_staff": msg.is_staff,
        "created_at": msg.created_at.isoformat(),
    }


def _serialize_thread(thread: SupportThread, *, include_messages: bool = False) -> dict:
    data = {
        "id": str(thread.id),
        "priority": thread.priority,
        "status": thread.status,
        "source": thread.source,
        "created_at": thread.created_at.isoformat(),
        "updated_at": thread.updated_at.isoformat(),
        "message_count": thread.messages.count(),
        "preview": "",
    }
    first = thread.messages.order_by("created_at").first()
    if first:
        preview = first.body.strip()
        data["preview"] = preview[:120] + ("…" if len(preview) > 120 else "")
    if include_messages:
        data["messages"] = [_serialize_message(m) for m in thread.messages.select_related("author").order_by("created_at")]
    return data


def _validate_message_body(body: str) -> str | None:
    text = (body or "").strip()
    if len(text) < MIN_MESSAGE_LEN:
        return f"Message must be at least {MIN_MESSAGE_LEN} characters."
    if len(text) > MAX_MESSAGE_LEN:
        return f"Message must be at most {MAX_MESSAGE_LEN} characters."
    return None


def _check_rate_limits(user, priority: str) -> str | None:
    now = timezone.now()
    cooldown_since = now - timedelta(minutes=COOLDOWN_MINUTES)
    recent = SupportThread.objects.filter(user=user, created_at__gte=cooldown_since).exists()
    if recent:
        return f"Please wait {COOLDOWN_MINUTES} minutes between new requests."

    if priority == SupportThread.PRIORITY_CRITICAL:
        day_ago = now - timedelta(hours=24)
        critical_count = SupportThread.objects.filter(
            user=user,
            priority=SupportThread.PRIORITY_CRITICAL,
            created_at__gte=day_ago,
        ).count()
        if critical_count >= CRITICAL_DAILY_LIMIT:
            return f"You can submit at most {CRITICAL_DAILY_LIMIT} urgent requests per 24 hours."
    return None


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticatedStrict])
def support_threads(request):
    user = request.user

    if request.method == "GET":
        threads = SupportThread.objects.filter(user=user).prefetch_related("messages")[:50]
        return Response({"threads": [_serialize_thread(t) for t in threads]})

    payload = request.data if isinstance(request.data, dict) else {}
    message = str(payload.get("message") or "")
    priority = str(payload.get("priority") or SupportThread.PRIORITY_NORMAL).strip().lower()
    red_confirmed = bool(payload.get("red_confirmed"))

    err = _validate_message_body(message)
    if err:
        return _bad_request(err)

    valid_priorities = {
        SupportThread.PRIORITY_NORMAL,
        SupportThread.PRIORITY_ELEVATED,
        SupportThread.PRIORITY_CRITICAL,
    }
    if priority not in valid_priorities:
        return _bad_request("Invalid priority.")

    if priority == SupportThread.PRIORITY_CRITICAL and not red_confirmed:
        return _bad_request("Urgent requests require confirmation.")

    rate_err = _check_rate_limits(user, priority)
    if rate_err:
        return _bad_request(rate_err)

    now = timezone.now()
    with transaction.atomic():
        thread = SupportThread.objects.create(
            user=user,
            priority=priority,
            source=str(payload.get("source") or "dashboard/support")[:120],
            red_confirmed_at=now if priority == SupportThread.PRIORITY_CRITICAL else None,
        )
        SupportMessage.objects.create(
            thread=thread,
            author=user,
            body=message.strip(),
            is_staff=False,
        )

    user_email = (getattr(user, "email", None) or "").strip()
    display = _user_display(user)

    try:
        send_support_staff_alert(
            thread_id=str(thread.id),
            priority=priority,
            user_email=user_email or "unknown",
            user_name=display,
            message=message.strip(),
        )
    except Exception:
        pass

    try:
        if user_email:
            send_support_user_confirmation(to_email=user_email, thread_id=str(thread.id), priority=priority)
    except Exception:
        pass

    return Response(_serialize_thread(thread, include_messages=True), status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticatedStrict])
def support_thread_detail(request, thread_id):
    user = request.user
    try:
        thread = SupportThread.objects.prefetch_related("messages").get(id=thread_id, user=user)
    except SupportThread.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(_serialize_thread(thread, include_messages=True))

    if thread.status in (SupportThread.STATUS_RESOLVED, SupportThread.STATUS_CLOSED):
        return _bad_request("This request is closed. Open a new request if you need more help.")

    payload = request.data if isinstance(request.data, dict) else {}
    message = str(payload.get("message") or "")
    err = _validate_message_body(message)
    if err:
        return _bad_request(err)

    SupportMessage.objects.create(
        thread=thread,
        author=user,
        body=message.strip(),
        is_staff=False,
    )
    thread.updated_at = timezone.now()
    thread.save(update_fields=["updated_at"])

    user_email = (getattr(user, "email", None) or "").strip()
    display = _user_display(user)
    try:
        send_support_staff_alert(
            thread_id=str(thread.id),
            priority=thread.priority,
            user_email=user_email or "unknown",
            user_name=display,
            message=message.strip(),
            is_follow_up=True,
        )
    except Exception:
        pass

    return Response(_serialize_thread(thread, include_messages=True))
