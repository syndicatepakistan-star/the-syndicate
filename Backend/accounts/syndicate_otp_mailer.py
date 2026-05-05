"""Shared HTML OTP emails (member login/signup + affiliate partner portal)."""

from __future__ import annotations

import requests
import smtplib
import socket
import ssl
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags


def otp_email_headers() -> dict[str, str]:
  return {
    "Precedence": "bulk",
    "X-Auto-Response-Suppress": "All",
    "Auto-Submitted": "auto-generated",
  }


def otp_mail_reply_to() -> list[str] | None:
  raw = (getattr(settings, "OTP_MAIL_REPLY_TO", None) or "").strip()
  if not raw:
    return None
  addrs = [a.strip() for a in raw.split(",") if a.strip()]
  return addrs or None


def _resend_api_key() -> str:
  return (getattr(settings, "RESEND_API_KEY", None) or "").strip()


def _resend_api_url() -> str:
  raw = (getattr(settings, "RESEND_API_URL", None) or "").strip()
  return raw or "https://api.resend.com/emails"


def _email_timeout_seconds() -> int:
  raw = getattr(settings, "EMAIL_TIMEOUT", 15)
  try:
    value = int(raw)
  except (TypeError, ValueError):
    value = 15
  return value if value > 0 else 15


def _send_via_resend(to_email: str, subject: str, html_body: str, text_body: str) -> None:
  api_key = _resend_api_key()
  if not api_key:
    raise RuntimeError("Missing RESEND_API_KEY.")

  payload: dict[str, object] = {
    "from": settings.DEFAULT_FROM_EMAIL,
    "to": [to_email],
    "subject": subject,
    "html": html_body,
    "text": text_body,
    "headers": otp_email_headers(),
  }
  reply_to = otp_mail_reply_to()
  if reply_to:
    payload["reply_to"] = reply_to

  resp = requests.post(
    _resend_api_url(),
    headers={
      "Authorization": f"Bearer {api_key}",
      "Content-Type": "application/json",
    },
    json=payload,
    timeout=_email_timeout_seconds(),
  )
  if resp.status_code >= 400:
    raise RuntimeError(f"Resend API failed ({resp.status_code}): {resp.text[:400]}")


def _create_ipv4_socket(host: str, port: int, timeout: float | None, source_address=None):
  infos = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
  if not infos:
    raise OSError(f"Could not resolve IPv4 address for SMTP host: {host}")
  last_error: OSError | None = None
  for family, socktype, proto, _canonname, sockaddr in infos:
    sock = socket.socket(family, socktype, proto)
    try:
      if source_address:
        sock.bind(source_address)
      if timeout is not None:
        sock.settimeout(timeout)
      sock.connect(sockaddr)
      return sock
    except OSError as exc:
      last_error = exc
      try:
        sock.close()
      except OSError:
        pass
  if last_error is not None:
    raise last_error
  raise OSError(f"Could not connect to SMTP IPv4 address for host: {host}")


class _SMTPIPv4(smtplib.SMTP):
  def _get_socket(self, host, port, timeout):
    return _create_ipv4_socket(host, port, timeout, self.source_address)


class _SMTPSSLIPv4(smtplib.SMTP_SSL):
  def _get_socket(self, host, port, timeout):
    raw_socket = _create_ipv4_socket(host, port, timeout, self.source_address)
    ssl_context = self.context or ssl.create_default_context()
    return ssl_context.wrap_socket(raw_socket, server_hostname=host)


def _send_via_smtp_ipv4_retry(msg: EmailMultiAlternatives) -> None:
  host = str(getattr(settings, "EMAIL_HOST", "") or "").strip()
  if not host:
    raise RuntimeError("SMTP host is not configured.")
  port = int(getattr(settings, "EMAIL_PORT", 587) or 587)
  timeout = _email_timeout_seconds()
  use_ssl = bool(getattr(settings, "EMAIL_USE_SSL", False))
  use_tls = bool(getattr(settings, "EMAIL_USE_TLS", False))
  username = str(getattr(settings, "EMAIL_HOST_USER", "") or "").strip()
  password = str(getattr(settings, "EMAIL_HOST_PASSWORD", "") or "")

  if use_ssl:
    client = _SMTPSSLIPv4(host=host, port=port, timeout=timeout)
  else:
    client = _SMTPIPv4(host=host, port=port, timeout=timeout)

  try:
    if (not use_ssl) and use_tls:
      client.starttls(context=ssl.create_default_context())
    if username and password:
      client.login(username, password)
    sender = msg.from_email or username
    if not sender:
      raise RuntimeError("DEFAULT_FROM_EMAIL is required for SMTP sending.")
    recipients = list(msg.to or [])
    if not recipients:
      raise RuntimeError("Recipient email is required for SMTP sending.")
    client.sendmail(sender, recipients, msg.message().as_string())
  finally:
    try:
      client.quit()
    except Exception:
      client.close()


def build_syndicate_otp_email_html(
  *,
  header_badge: str,
  greeting_line: str,
  intro_paragraph: str,
  otp_box_label: str,
  otp_code: str,
  expires_minutes: int,
  ignore_line: str,
) -> str:
  return f"""
  <div style="margin:0;padding:34px 16px;background:#020305;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#d8e5f2;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #cda936;border-radius:16px;background:radial-gradient(920px 460px at 8% -8%,rgba(34,211,238,0.12),rgba(0,0,0,0) 56%),radial-gradient(760px 420px at 100% 0%,rgba(250,204,21,0.10),rgba(0,0,0,0) 58%),#070a10;overflow:hidden;box-shadow:0 0 0 1px rgba(205,169,54,0.28),0 0 0 2px rgba(250,204,21,0.06) inset,0 26px 88px rgba(0,0,0,0.7);">
      <div style="padding:20px 24px 16px;border-bottom:1px solid #cda936;background:linear-gradient(140deg,rgba(5,12,18,0.96),rgba(7,9,13,0.98));">
        <div style="display:inline-block;padding:5px 10px;border:1px solid #cda936;border-radius:3px;background:rgba(205,169,54,0.12);font-size:10px;font-weight:700;letter-spacing:1.7px;color:#fde68a;text-transform:uppercase;">{header_badge}</div>
        <div style="margin-top:11px;font-size:33px;line-height:1.02;font-weight:800;letter-spacing:1.6px;color:#facc15;text-transform:uppercase;">The Syndicate</div>
        <div style="margin-top:8px;font-size:12px;letter-spacing:1.7px;color:#c5d4e6;text-transform:uppercase;">Money, Power, Honour and Freedom.</div>
        <div style="margin-top:10px;height:1px;background:linear-gradient(90deg,rgba(34,211,238,0.55),rgba(250,204,21,0.28),rgba(0,0,0,0));"></div>
      </div>
      <div style="padding:26px;">
        <p style="margin:0 0 11px;font-size:15px;line-height:1.5;color:#c7d8e8;">{greeting_line}</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#b8c9dc;">
          {intro_paragraph}
        </p>
        <div style="margin:0 0 16px;padding:20px 16px;border:1px solid #cda936;border-radius:12px;background:linear-gradient(145deg,rgba(9,18,28,0.96),rgba(9,12,18,0.98));text-align:center;box-shadow:inset 0 0 0 1px rgba(205,169,54,0.15),0 0 26px rgba(205,169,54,0.16);">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7ddbf4;">{otp_box_label}</div>
          <div style="margin-top:10px;font-size:44px;line-height:1;font-weight:800;letter-spacing:9px;color:#facc15;text-shadow:0 0 18px rgba(250,204,21,0.35);">{otp_code}</div>
          <div style="margin-top:12px;font-size:11px;letter-spacing:1.8px;color:#9fb3c8;text-transform:uppercase;">Encrypted Token - Do Not Share</div>
        </div>
        <div style="margin:0 0 14px;padding:12px 14px;border-left:3px solid #cda936;border-top:1px solid #cda936;border-right:1px solid #cda936;border-bottom:1px solid #cda936;border-radius:8px;background:rgba(9,22,34,0.85);font-size:13px;color:#cde8f7;">
          Session window: <strong style="color:#f8fafc;">{expires_minutes} minutes</strong>. Expired token requires regeneration.
        </div>
        <p style="margin:0 0 12px;font-size:13px;color:#93a8bf;">
          This key auto-expires in <strong style="color:#e5e7eb;">{expires_minutes} minutes</strong>.
        </p>
        <p style="margin:0;font-size:12px;line-height:1.65;color:#70839a;">
          {ignore_line}
        </p>
        <p style="margin:12px 0 0;font-size:11px;line-height:1.55;color:#64748b;">
          This message was sent automatically for security verification. This mailbox is not monitored—please do not reply.
        </p>
      </div>
      <div style="padding:12px 24px 16px;border-top:1px solid #cda936;background:rgba(6,10,14,0.72);font-size:11px;letter-spacing:1.1px;color:#6f8194;text-transform:uppercase;">
        The Syndicate - Operator Security Mailer
      </div>
    </div>
  </div>
  """


def send_syndicate_otp_html_email(to_email: str, subject: str, html_body: str) -> None:
  body = strip_tags(html_body)
  # Prefer HTTPS mail API in cloud (Railway-friendly). Fall back to SMTP when key is absent.
  if _resend_api_key():
    _send_via_resend(to_email=to_email, subject=subject, html_body=html_body, text_body=body)
    return

  msg = EmailMultiAlternatives(
    subject=subject,
    body=body,
    from_email=settings.DEFAULT_FROM_EMAIL,
    to=[to_email],
    headers=otp_email_headers(),
    reply_to=otp_mail_reply_to(),
  )
  msg.attach_alternative(html_body, "text/html")
  try:
    msg.send(fail_silently=False)
  except OSError as exc:
    # Railway can fail IPv6 SMTP egress with Errno 101. Retry using IPv4-only sockets.
    if getattr(exc, "errno", None) == 101:
      _send_via_smtp_ipv4_retry(msg)
      return
    raise
