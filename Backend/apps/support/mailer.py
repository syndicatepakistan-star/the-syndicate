from __future__ import annotations

from django.conf import settings

from accounts.syndicate_otp_mailer import send_syndicate_otp_html_email

from .whatsapp import support_user_message

_DEFAULT_SUPPORT_INBOX = "syndicatepakistan@gmail.com"


def _support_recipients(priority: str) -> list[str]:
    critical = (getattr(settings, "SUPPORT_EMAIL_CRITICAL", None) or "").strip()
    elevated = (getattr(settings, "SUPPORT_EMAIL_ELEVATED", None) or "").strip()
    normal = (getattr(settings, "SUPPORT_EMAIL_NORMAL", None) or "").strip()
    fallback = (getattr(settings, "SUPPORT_EMAIL", None) or "").strip() or _DEFAULT_SUPPORT_INBOX

    chosen: list[str] = []
    if priority == "critical" and critical:
        chosen = [a.strip() for a in critical.split(",") if a.strip()]
    elif priority == "elevated" and elevated:
        chosen = [a.strip() for a in elevated.split(",") if a.strip()]
    elif normal:
        chosen = [a.strip() for a in normal.split(",") if a.strip()]
    elif fallback:
        chosen = [a.strip() for a in fallback.split(",") if a.strip()]

    # Always notify the main Syndicate inbox.
    if _DEFAULT_SUPPORT_INBOX not in chosen:
        chosen.append(_DEFAULT_SUPPORT_INBOX)
    return chosen


def _priority_label(priority: str) -> str:
    return {
        "critical": "URGENT",
        "elevated": "HIGH PRIORITY",
        "normal": "STANDARD",
    }.get(priority, priority.upper())


def _priority_color(priority: str) -> str:
    return {
        "critical": "#f87171",
        "elevated": "#facc15",
        "normal": "#7dd3fc",
    }.get(priority, "#94a3b8")


def _staff_alert_html(*, label: str, color: str, kind: str, thread_id: str, user_name: str, user_email: str, safe_body: str) -> str:
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:system-ui,sans-serif;background:#0a0f14;color:#e2e8f0;padding:24px;">'
        "<tr><td>"
        f'<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid {color};border-radius:8px;">'
        f'<tr><td style="padding:16px 20px;border-bottom:1px solid {color};">'
        f'<p style="margin:0;font-size:11px;letter-spacing:2px;color:{color};text-transform:uppercase;">{label}</p>'
        f'<h1 style="margin:8px 0 0;font-size:18px;color:#f8fafc;">Support {kind}</h1>'
        f'<p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">Ticket <strong>{thread_id}</strong></p>'
        "</td></tr>"
        '<tr><td style="padding:20px;">'
        f'<p style="margin:0 0 16px;font-size:14px;"><strong>{user_name}</strong> &lt;{user_email}&gt;</p>'
        f'<p style="margin:0;padding:14px;border-left:3px solid {color};font-size:14px;line-height:1.6;white-space:pre-wrap;">{safe_body}</p>'
        "</td></tr></table>"
        "</td></tr></table>"
    )


def send_support_staff_alert(
    *,
    thread_id: str,
    priority: str,
    user_email: str,
    user_name: str,
    message: str,
    is_follow_up: bool = False,
) -> None:
    recipients = _support_recipients(priority)
    if not recipients:
        return

    label = _priority_label(priority)
    color = _priority_color(priority)
    kind = "Follow-up" if is_follow_up else "New request"
    subject = f"[{label}] Support {kind} #{str(thread_id)[:8]} — {user_email}"
    safe_body = (message or "").replace("<", "&lt;").replace(">", "&gt;")
    html = _staff_alert_html(
        label=label,
        color=color,
        kind=kind,
        thread_id=str(thread_id),
        user_name=user_name,
        user_email=user_email,
        safe_body=safe_body,
    )

    for addr in recipients:
        send_syndicate_otp_html_email(addr, subject, html)


def send_support_user_confirmation(
    *,
    to_email: str,
    priority: str,
    is_follow_up: bool = False,
) -> None:
    if not to_email:
        return
    label = _priority_label(priority)
    body = support_user_message(priority=priority, is_follow_up=is_follow_up)
    subject = (
        f"We received your support reply ({label})"
        if is_follow_up
        else f"We received your support request ({label})"
    )
    safe_body = body.replace("<", "&lt;").replace(">", "&gt;")
    html = (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:system-ui,sans-serif;background:#0a0f14;color:#e2e8f0;padding:24px;">'
        "<tr><td>"
        '<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;border:1px solid #cda936;border-radius:8px;">'
        '<tr><td style="padding:20px;">'
        '<h1 style="margin:0 0 12px;font-size:18px;color:#facc15;">Request received</h1>'
        f'<p style="margin:0;font-size:14px;line-height:1.6;color:#cbd5e1;">{safe_body}</p>'
        "</td></tr></table>"
        "</td></tr></table>"
    )
    send_syndicate_otp_html_email(to_email, subject, html)
