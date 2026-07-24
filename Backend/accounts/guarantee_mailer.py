"""Bulletproof Guarantee apply — notify intelligence@the-syndicate.com."""

from __future__ import annotations

import logging
from html import escape

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

from accounts.syndicate_otp_mailer import (
  _email_timeout_seconds,
  _resend_api_key,
  _resend_api_url,
  otp_email_headers,
)

logger = logging.getLogger(__name__)

GUARANTEE_INTELLIGENCE_EMAIL = "intelligence@the-syndicate.com"


def guarantee_notify_email() -> str:
  raw = (getattr(settings, "GUARANTEE_NOTIFY_EMAIL", None) or "").strip()
  return raw or GUARANTEE_INTELLIGENCE_EMAIL


def build_guarantee_apply_email_html(
  *,
  member_email: str,
  member_name: str,
  member_id: int,
  request_type: str,
  program_label: str,
  message: str,
  purchases_summary: str,
) -> str:
  safe = {
    "member_email": escape(member_email),
    "member_name": escape(member_name or member_email),
    "member_id": escape(str(member_id)),
    "request_type": escape(request_type),
    "program_label": escape(program_label or "—"),
    "message": escape(message).replace("\n", "<br/>"),
    "purchases_summary": escape(purchases_summary or "—").replace("\n", "<br/>"),
  }
  return f"""
  <div style="margin:0;padding:34px 16px;background:#020305;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#d8e5f2;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #a020f0;border-radius:16px;background:#070a10;overflow:hidden;">
      <div style="padding:20px 24px 16px;border-bottom:1px solid #a020f0;">
        <div style="font-size:11px;letter-spacing:1.6px;color:#c084fc;text-transform:uppercase;">Bulletproof Guarantee</div>
        <div style="margin-top:8px;font-size:26px;font-weight:800;color:#facc15;text-transform:uppercase;">New Apply Request</div>
      </div>
      <div style="padding:24px;font-size:14px;line-height:1.65;color:#c7d8e8;">
        <p style="margin:0 0 12px;"><strong style="color:#fde68a;">Member:</strong> {safe["member_name"]} ({safe["member_email"]})</p>
        <p style="margin:0 0 12px;"><strong style="color:#fde68a;">User ID:</strong> {safe["member_id"]}</p>
        <p style="margin:0 0 12px;"><strong style="color:#fde68a;">Request type:</strong> {safe["request_type"]}</p>
        <p style="margin:0 0 12px;"><strong style="color:#fde68a;">Program / purchase:</strong> {safe["program_label"]}</p>
        <p style="margin:0 0 8px;"><strong style="color:#fde68a;">Paid entitlements:</strong></p>
        <p style="margin:0 0 16px;padding:12px;border:1px solid rgba(160,32,240,0.35);border-radius:8px;background:rgba(0,0,0,0.35);">{safe["purchases_summary"]}</p>
        <p style="margin:0 0 8px;"><strong style="color:#fde68a;">Issue / details (why they are applying):</strong></p>
        <p style="margin:0;padding:12px;border:1px solid rgba(250,204,21,0.35);border-radius:8px;background:rgba(0,0,0,0.35);">{safe["message"]}</p>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Reply to this email to contact the member directly.</p>
      </div>
    </div>
  </div>
  """


def send_guarantee_apply_email(
  *,
  member_email: str,
  member_name: str,
  member_id: int,
  request_type: str,
  program_label: str,
  message: str,
  purchases_summary: str,
) -> None:
  to_email = guarantee_notify_email()
  subject = f"[Guarantee] {request_type} — {member_email}"
  html = build_guarantee_apply_email_html(
    member_email=member_email,
    member_name=member_name,
    member_id=member_id,
    request_type=request_type,
    program_label=program_label,
    message=message,
    purchases_summary=purchases_summary,
  )
  text_body = strip_tags(html)

  if _resend_api_key():
    payload = {
      "from": settings.DEFAULT_FROM_EMAIL,
      "to": [to_email],
      "subject": subject,
      "html": html,
      "text": text_body,
      "reply_to": [member_email],
      "headers": otp_email_headers(),
    }
    resp = requests.post(
      _resend_api_url(),
      headers={
        "Authorization": f"Bearer {_resend_api_key()}",
        "Content-Type": "application/json",
      },
      json=payload,
      timeout=_email_timeout_seconds(),
    )
    if resp.status_code >= 400:
      raise RuntimeError(f"Resend API failed ({resp.status_code}): {resp.text[:400]}")
    logger.info("Guarantee apply email sent via Resend to %s for %s", to_email, member_email)
    return

  msg = EmailMultiAlternatives(
    subject=subject,
    body=text_body,
    from_email=settings.DEFAULT_FROM_EMAIL,
    to=[to_email],
    reply_to=[member_email],
    headers=otp_email_headers(),
  )
  msg.attach_alternative(html, "text/html")
  msg.send(fail_silently=False)
  logger.info("Guarantee apply email sent via SMTP to %s for %s", to_email, member_email)
