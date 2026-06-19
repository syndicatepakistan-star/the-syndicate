from __future__ import annotations

import html

from django.conf import settings

from accounts.syndicate_otp_mailer import send_syndicate_otp_html_email

from .models import WithdrawalRequest


def _withdrawal_alert_recipients() -> list[str]:
    dedicated = (getattr(settings, "AFFILIATE_WITHDRAWAL_ALERT_EMAIL", None) or "").strip()
    if dedicated:
        return [addr.strip() for addr in dedicated.split(",") if addr.strip()]

    for key in ("SUPPORT_EMAIL_CRITICAL", "SUPPORT_EMAIL_ELEVATED", "SUPPORT_EMAIL_NORMAL", "SUPPORT_EMAIL"):
        raw = (getattr(settings, key, None) or "").strip()
        if raw:
            return [addr.strip() for addr in raw.split(",") if addr.strip()]
    return ["syndicatepakistan@gmail.com"]


def _alert_html(*, withdrawal: WithdrawalRequest, affiliate_email: str, admin_url: str) -> str:
    profile = withdrawal.profile
    referral_id = withdrawal.section_referral.referral_id
    safe_name = html.escape(profile.display_name or "Affiliate")
    safe_email = html.escape(affiliate_email or "—")
    safe_referral = html.escape(referral_id)
    safe_bank = html.escape(withdrawal.bank_name)
    safe_account = html.escape(withdrawal.account_name)
    safe_iban = html.escape(withdrawal.iban)
    amount = html.escape(str(withdrawal.requested_amount))
    snapshot = html.escape(str(withdrawal.earnings_snapshot))
    safe_admin = html.escape(admin_url)

    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="font-family:system-ui,sans-serif;background:#0a0f14;color:#e2e8f0;padding:24px;">'
        "<tr><td>"
        '<table role="presentation" width="560" cellpadding="0" cellspacing="0" '
        'style="max-width:560px;border:1px solid #34d399;border-radius:8px;">'
        '<tr><td style="padding:16px 20px;border-bottom:1px solid #34d399;">'
        '<p style="margin:0;font-size:11px;letter-spacing:2px;color:#34d399;text-transform:uppercase;">'
        "Affiliate payout</p>"
        '<h1 style="margin:8px 0 0;font-size:18px;color:#f8fafc;">New withdrawal request</h1>'
        f'<p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">Request #{withdrawal.id}</p>'
        "</td></tr>"
        '<tr><td style="padding:20px;font-size:14px;line-height:1.6;">'
        f"<p><strong>{safe_name}</strong> &lt;{safe_email}&gt;</p>"
        f"<p>Referral ID: <strong>{safe_referral}</strong></p>"
        f"<p>Requested payout: <strong>${amount}</strong> (balance snapshot: ${snapshot})</p>"
        f"<p>Bank: {safe_bank}<br/>Account: {safe_account}<br/>IBAN: {safe_iban}</p>"
        f'<p style="margin-top:18px;"><a href="{safe_admin}" '
        'style="color:#34d399;">Review in Django Admin</a></p>'
        "</td></tr></table>"
        "</td></tr></table>"
    )


def send_affiliate_withdrawal_staff_alert(
    *,
    withdrawal: WithdrawalRequest,
    affiliate_email: str,
    admin_url: str,
) -> None:
    recipients = _withdrawal_alert_recipients()
    if not recipients:
        return

    subject = (
        f"[Affiliate withdrawal] ${withdrawal.requested_amount} — "
        f"{withdrawal.profile.display_name or affiliate_email or 'partner'}"
    )
    html_body = _alert_html(withdrawal=withdrawal, affiliate_email=affiliate_email, admin_url=admin_url)
    for addr in recipients:
        send_syndicate_otp_html_email(addr, subject, html_body)
