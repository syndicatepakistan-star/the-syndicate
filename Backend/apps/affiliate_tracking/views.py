from __future__ import annotations

import html
import random
import secrets
from datetime import timedelta
from decimal import Decimal, InvalidOperation
import re

from django.conf import settings
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.db.models import Max, Sum
from django.http import JsonResponse
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from accounts.syndicate_otp_mailer import build_syndicate_otp_email_html, send_syndicate_otp_html_email

from .models import ApiToken, AffiliateProfile, ClickEvent, EmailOTP, LeadEvent, SaleEvent, SectionReferral, WithdrawalRequest

CLICK_POINTS = 1
LEAD_POINTS = 5
SALE_POINTS_PER_DOLLAR = 1
COMMISSION_TIER_THRESHOLD = Decimal("333")
COMMISSION_RATE_LOW = Decimal("0.15")
COMMISSION_RATE_HIGH = Decimal("0.30")
ONE_TIME_REFERRAL_PATTERN = re.compile(r"^[a-z0-9_]+-syn-\d{6}$")


def _now_iso() -> str:
    return timezone.now().isoformat()


def _bad_request(message: str, status_code: int = 400):
    return JsonResponse({"success": False, "error": message}, status=status_code)


def _get_json(request):
    try:
        import json

        return json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return {}


def _slug_name(name: str) -> str:
    out = "".join(ch.lower() if ch.isalnum() else "_" for ch in name.strip())
    out = "_".join(part for part in out.split("_") if part)
    return out[:32] or "affiliate"


def _card_slug(section: str) -> str:
    mapping = {
        "complete": "fullbundle",
        "single": "singleprogram",
        "pawn": "pawn",
        "king": "king",
        # Legacy alias to keep old callers safe.
        "exclusive": "king",
    }
    return mapping.get(section, section[:12].lower())


def _generate_unique_referral_id(base_slug: str, section: str) -> str:
    prefix = base_slug
    if section != "complete":
        prefix = f"{base_slug}_{_card_slug(section)}"
    for _ in range(30):
        suffix = f"syn-{random.randint(0, 999999):06d}"
        candidate = f"{prefix}-{suffix}"
        if not SectionReferral.objects.filter(referral_id=candidate).exists():
            return candidate
    # Last-resort fallback with larger entropy.
    return f"{prefix}-syn-{secrets.randbelow(10**6):06d}"


def _commission_rate_for_purchase(purchase_amount: Decimal) -> Decimal:
    if purchase_amount >= COMMISSION_TIER_THRESHOLD:
        return COMMISSION_RATE_HIGH
    return COMMISSION_RATE_LOW


def _commission_amount_for_purchase(purchase_amount: Decimal) -> Decimal:
    return (purchase_amount * _commission_rate_for_purchase(purchase_amount)).quantize(Decimal("0.01"))


def _ensure_one_time_complete_referral(profile: AffiliateProfile) -> SectionReferral:
    referral = _ensure_section_referral(profile=profile, section="complete", base_slug=profile.referral_base)
    if ONE_TIME_REFERRAL_PATTERN.match(referral.referral_id):
        return referral
    for _ in range(30):
        candidate = _generate_unique_referral_id(base_slug=profile.referral_base, section="complete")
        if not SectionReferral.objects.filter(referral_id=candidate).exists():
            referral.referral_id = candidate
            referral.save(update_fields=["referral_id"])
            return referral
    return referral


def _display_name_from_email(email: str) -> str:
    local = (email.split("@")[0] if "@" in email else email).strip()
    cleaned = "".join(ch if ch.isalnum() else " " for ch in local)
    normalized = " ".join(part for part in cleaned.split() if part)
    return (normalized.title() or "Affiliate")[:120]


def _email_local_slug(email: str) -> str:
    local = (email.split("@")[0] if "@" in email else email).strip().lower()
    return _slug_name(local)[:32] or "affiliate"


def _ensure_section_referral(profile: AffiliateProfile, section: str, base_slug: str) -> SectionReferral:
    existing = profile.section_referrals.filter(section=section).first()
    if existing:
        return existing
    return SectionReferral.objects.create(
        profile=profile,
        section=section,
        referral_id=_generate_unique_referral_id(base_slug=base_slug, section=section),
    )


def _ensure_profile_by_email(email: str) -> tuple[User, AffiliateProfile]:
    normalized_email = email.strip().lower()
    display_name = _display_name_from_email(normalized_email)
    user, _ = User.objects.get_or_create(
        username=normalized_email,
        defaults={"email": normalized_email, "first_name": display_name},
    )
    profile, _ = AffiliateProfile.objects.get_or_create(
        user=user,
        defaults={
            "display_name": display_name,
            "referral_base": _email_local_slug(normalized_email),
        },
    )
    updates = []
    if not profile.display_name:
        profile.display_name = display_name
        updates.append("display_name")
    if not profile.referral_base:
        profile.referral_base = _email_local_slug(normalized_email)
        updates.append("referral_base")
    if updates:
        profile.save(update_fields=updates)
    for section in ("complete", "single", "pawn", "king"):
        _ensure_section_referral(profile=profile, section=section, base_slug=profile.referral_base)
    return user, profile


def _ensure_profile(name: str) -> tuple[User, AffiliateProfile]:
    clean_name = name.strip()[:120]
    existing_profile = AffiliateProfile.objects.select_related("user").filter(display_name__iexact=clean_name).first()
    if existing_profile:
        user = existing_profile.user
        profile = existing_profile
    else:
        base_username = f"user_{_slug_name(clean_name)}"
        username = base_username
        idx = 2
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{idx}"
            idx += 1
        user = User.objects.create(username=username, first_name=clean_name)
        profile = AffiliateProfile.objects.create(user=user, display_name=clean_name, referral_base=_slug_name(clean_name))
    if not profile.referral_base:
        profile.referral_base = _slug_name(profile.display_name or clean_name)
        profile.save(update_fields=["referral_base"])
    for section in ("complete", "single", "pawn", "king"):
        _ensure_section_referral(profile=profile, section=section, base_slug=profile.referral_base)
    return user, profile


def _get_referral_or_400(affiliate_id: str):
    try:
        return SectionReferral.objects.select_related("profile").get(referral_id=affiliate_id)
    except SectionReferral.DoesNotExist:
        return None


def ensure_affiliate_profile_for_existing_user(user: User) -> AffiliateProfile:
    """
    Link AffiliateProfile + SectionReferral rows to a Django user (e.g. OTP signup/login).
    Referral IDs are derived from display name + user id (see _referral_code); they are not
    the legacy hard-coded demo id.
    """
    email = (user.email or "").strip().lower()
    display_name = (
        _display_name_from_email(email)
        if email
        else (user.get_full_name() or user.username or "Affiliate")
    )[:120]
    profile, _ = AffiliateProfile.objects.get_or_create(
        user=user,
        defaults={
            "display_name": display_name,
            "referral_base": _email_local_slug(email) if email else _slug_name(display_name),
        },
    )
    updates = []
    if not profile.display_name:
        profile.display_name = display_name
        updates.append("display_name")
    if not profile.referral_base:
        profile.referral_base = _email_local_slug(email) if email else _slug_name(display_name)
        updates.append("referral_base")
    if updates:
        profile.save(update_fields=updates)
    for section in ("complete", "single", "pawn", "king"):
        _ensure_section_referral(profile=profile, section=section, base_slug=profile.referral_base)
    return profile


def referral_ids_payload(profile: AffiliateProfile) -> dict[str, str]:
    refs = {r.section: r.referral_id for r in profile.section_referrals.all()}
    return {
        "complete": refs.get("complete", ""),
        "single": refs.get("single", ""),
        "pawn": refs.get("pawn", refs.get("single", "")),
        "king": refs.get("king", refs.get("exclusive", "")),
        # Back-compat field expected by older frontend.
        "exclusive": refs.get("king", refs.get("exclusive", "")),
    }


def _iso_or_none(value):
    return value.isoformat() if value else None


def _section_stats(referral: SectionReferral) -> dict:
    click_qs = referral.click_events.all()
    lead_qs = referral.lead_events.all()
    sale_qs = referral.sale_events.all()

    click_count = click_qs.count()
    lead_count = lead_qs.count()
    sale_count = sale_qs.count()
    section_earnings = sale_qs.aggregate(v=Sum("amount")).get("v") or Decimal("0.00")
    # Conversion blends lead-rate and sale-rate so it reflects clicks, leads, and sales together.
    conversion_rate = (
        int(round((((lead_count / click_count) + (sale_count / click_count)) / 2) * 100)) if click_count > 0 else 0
    )

    return {
        "section": referral.section,
        "affiliate_id": referral.referral_id,
        "click_count": click_count,
        "lead_count": lead_count,
        "sale_count": sale_count,
        "conversion_rate": conversion_rate,
        "earnings_total": str(section_earnings),
        "last_click_at": _iso_or_none(click_qs.aggregate(v=Max("created_at")).get("v")),
        "last_lead_at": _iso_or_none(lead_qs.aggregate(v=Max("created_at")).get("v")),
        "last_sale_at": _iso_or_none(sale_qs.aggregate(v=Max("created_at")).get("v")),
        "lead_emails": sorted(set(lead_qs.values_list("email", flat=True))),
    }


def _overall_stats(profile: AffiliateProfile) -> dict:
    all_referrals = profile.section_referrals.all()
    click_qs = ClickEvent.objects.filter(referral__in=all_referrals)
    lead_qs = LeadEvent.objects.filter(referral__in=all_referrals)
    sale_qs = SaleEvent.objects.filter(referral__in=all_referrals)
    click_count = click_qs.count()
    lead_count = lead_qs.count()
    sale_count = sale_qs.count()
    # Earnings are profile-wide (all sections) so dashboard "overall" stays consistent.
    commission_total = sale_qs.aggregate(v=Sum("amount")).get("v") or Decimal("0.00")
    profile.earnings_total = commission_total
    profile.save(update_fields=["earnings_total"])
    # Conversion blends lead-rate and sale-rate so it reflects clicks, leads, and sales together.
    conversion_rate = (
        int(round((((lead_count / click_count) + (sale_count / click_count)) / 2) * 100)) if click_count > 0 else 0
    )

    return {
        "click_count": click_count,
        "lead_count": lead_count,
        "sale_count": sale_count,
        "conversion_rate": conversion_rate,
        "point_total": profile.points_total,
        "earnings_total": str(profile.earnings_total),
        "last_click_at": _iso_or_none(click_qs.aggregate(v=Max("created_at")).get("v")),
        "last_lead_at": _iso_or_none(lead_qs.aggregate(v=Max("created_at")).get("v")),
        "last_sale_at": _iso_or_none(sale_qs.aggregate(v=Max("created_at")).get("v")),
        "lead_emails": sorted(set(lead_qs.values_list("email", flat=True))),
    }


def _stats_payload(referral: SectionReferral) -> dict:
    current = _section_stats(referral)
    overall = _overall_stats(referral.profile)

    by_section = {}
    for section_name in ("complete", "single", "pawn", "king"):
        section_ref = referral.profile.section_referrals.filter(section=section_name).first()
        if section_ref:
            by_section[section_name] = _section_stats(section_ref)
        else:
            by_section[section_name] = {
                "section": section_name,
                "affiliate_id": "",
                "click_count": 0,
                "lead_count": 0,
                "sale_count": 0,
                "conversion_rate": 0,
                "earnings_total": "0.00",
                "last_click_at": None,
                "last_lead_at": None,
                "last_sale_at": None,
                "lead_emails": [],
            }

    # Keep legacy top-level keys as selected-section values for compatibility.
    return {
        "affiliate_id": current["affiliate_id"],
        "section": current["section"],
        "click_count": current["click_count"],
        "lead_count": current["lead_count"],
        "sale_count": current["sale_count"],
        "point_total": overall["point_total"],
        "earnings_total": overall["earnings_total"],
        "last_click_at": current["last_click_at"],
        "last_lead_at": current["last_lead_at"],
        "last_sale_at": current["last_sale_at"],
        "lead_emails": current["lead_emails"],
        "overall": overall,
        "current_section": current,
        "by_section": by_section,
    }


@require_GET
def health(_request):
    return JsonResponse({"status": "ok", "backend": "django", "at": _now_iso()})


@csrf_exempt
@require_POST
def auth_login(request):
    # Legacy endpoint retained for compatibility; now expects email.
    payload = _get_json(request)
    email = str(payload.get("email") or payload.get("name") or "").strip().lower()
    if not email:
        return _bad_request("email is required")
    try:
        validate_email(email)
    except ValidationError:
        return _bad_request("A valid email is required")

    user, profile = _ensure_profile_by_email(email)
    token = secrets.token_hex(24)
    ApiToken.objects.create(user=user, token=token)
    refs = {r.section: r.referral_id for r in profile.section_referrals.all()}
    return JsonResponse(
        {
            "success": True,
            "token": token,
            "user": {
                "display_name": profile.display_name,
                "email": user.email or email,
                "referral_ids": refs,
            },
        }
    )


@csrf_exempt
@require_POST
def auth_request_otp(request):
    payload = _get_json(request)
    email = str(payload.get("email") or "").strip().lower()
    if not email:
        return _bad_request("email is required")
    try:
        validate_email(email)
    except ValidationError:
        return _bad_request("A valid email is required")

    code = f"{random.randint(0, 999999):06d}"
    expires_at = timezone.now() + timedelta(minutes=getattr(settings, "OTP_EXPIRES_MINUTES", 10))
    EmailOTP.objects.filter(email=email, is_used=False).update(is_used=True)
    EmailOTP.objects.create(email=email, code=code, expires_at=expires_at, is_used=False)

    expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
    display = html.escape(email.split("@")[0].strip() if "@" in email else email)
    subject = "Your Syndicate affiliate verification code"
    html_body = build_syndicate_otp_email_html(
        header_badge="Partner Access Node",
        greeting_line=f'Partner <span style="color:#fef3c7;">{display}</span>,',
        intro_paragraph=(
            "Affiliate dashboard handshake initiated. Use this access code to complete partner login "
            "(separate from the member dashboard OTP)."
        ),
        otp_box_label="One-time Code",
        otp_code=code,
        expires_minutes=expires_minutes,
        ignore_line="If you did not request affiliate access, you can safely ignore this email.",
    )
    using_console_backend = "console.EmailBackend" in getattr(settings, "EMAIL_BACKEND", "")
    if using_console_backend:
        if getattr(settings, "DEBUG", False):
            return JsonResponse(
                {
                    "success": True,
                    "message": "Dev mode: OTP not emailed (console backend). Use dev_otp below.",
                    "delivery": "console",
                    "dev_otp": code,
                }
            )
        return _bad_request(
            "OTP email is disabled. Configure SMTP (EMAIL_BACKEND/EMAIL_HOST/EMAIL_HOST_USER/EMAIL_HOST_PASSWORD) and try again.",
            503,
        )

    try:
        send_syndicate_otp_html_email(email, subject, html_body)
    except Exception:
        return _bad_request("Could not send OTP email right now. Verify SMTP credentials/settings.", 503)

    return JsonResponse({"success": True, "message": "OTP sent to your email.", "delivery": "smtp"})


@csrf_exempt
@require_POST
def auth_verify_otp(request):
    payload = _get_json(request)
    email = str(payload.get("email") or "").strip().lower()
    otp = str(payload.get("otp") or "").strip()
    if not email:
        return _bad_request("email is required")
    if len(otp) != 6 or not otp.isdigit():
        return _bad_request("A valid 6-digit OTP is required")
    try:
        validate_email(email)
    except ValidationError:
        return _bad_request("A valid email is required")

    now = timezone.now()
    otp_row = (
        EmailOTP.objects.filter(email=email, code=otp, is_used=False, expires_at__gt=now)
        .order_by("-created_at")
        .first()
    )
    if not otp_row:
        return _bad_request("OTP invalid or expired", 401)

    otp_row.is_used = True
    otp_row.save(update_fields=["is_used"])

    user, profile = _ensure_profile_by_email(email)
    token = secrets.token_hex(24)
    ApiToken.objects.create(user=user, token=token)
    refs = {r.section: r.referral_id for r in profile.section_referrals.all()}
    return JsonResponse(
        {
            "success": True,
            "token": token,
            "user": {
                "display_name": profile.display_name,
                "email": user.email or email,
                "referral_ids": refs,
            },
        }
    )


@require_GET
def stats(request):
    affiliate_id = (request.GET.get("affiliate_id") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    return JsonResponse(_stats_payload(referral))


@csrf_exempt
@require_POST
def generate_referral_link(request):
    payload = _get_json(request)
    affiliate_id = str(payload.get("affiliate_id") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    complete_referral = _ensure_one_time_complete_referral(referral.profile)
    domain = str(payload.get("domain") or "http://localhost:3000").strip().rstrip("/")
    if not domain.startswith("http://") and not domain.startswith("https://"):
        domain = f"http://{domain}"
    link = f"{domain}/affiliate/{complete_referral.referral_id}"
    return JsonResponse(
        {
            "success": True,
            "affiliate_id": complete_referral.referral_id,
            "link": link,
            "created_once": True,
        }
    )


@csrf_exempt
@require_POST
def click(request):
    payload = _get_json(request)
    affiliate_id = str(payload.get("affiliate_id") or "").strip()
    visitor_id = str(payload.get("visitor_id") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    if not visitor_id:
        return _bad_request("visitor_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    _, created = ClickEvent.objects.get_or_create(referral=referral, visitor_id=visitor_id)
    if created:
        referral.profile.points_total += CLICK_POINTS
        referral.profile.save(update_fields=["points_total"])
    return JsonResponse({"success": True, "click_recorded": created, "stats": _stats_payload(referral)})


@csrf_exempt
@require_POST
def lead(request):
    payload = _get_json(request)
    affiliate_id = str(payload.get("affiliate_id") or "").strip()
    visitor_id = str(payload.get("visitor_id") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    if not visitor_id:
        return _bad_request("visitor_id is required")
    if not email or "@" not in email:
        return _bad_request("A valid email is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    _, _ = ClickEvent.objects.get_or_create(referral=referral, visitor_id=visitor_id)
    _, created = LeadEvent.objects.get_or_create(
        referral=referral, visitor_id=visitor_id, defaults={"email": email}
    )
    if not created:
        LeadEvent.objects.filter(referral=referral, visitor_id=visitor_id).update(email=email)
    else:
        referral.profile.points_total += LEAD_POINTS
        referral.profile.save(update_fields=["points_total"])
    return JsonResponse({"success": True, "lead_recorded": created, "stats": _stats_payload(referral)})


@csrf_exempt
@require_POST
def sale(request):
    payload = _get_json(request)
    affiliate_id = str(payload.get("affiliate_id") or "").strip()
    visitor_id = str(payload.get("visitor_id") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    amount_raw = str(payload.get("amount") or "").strip()
    purchase_amount_raw = str(payload.get("purchase_amount") or amount_raw).strip()
    currency = str(payload.get("currency") or "usd").strip().lower()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    if not visitor_id:
        return _bad_request("visitor_id is required")
    if not email or "@" not in email:
        return _bad_request("A valid email is required")
    try:
        purchase_amount = Decimal(purchase_amount_raw)
    except (InvalidOperation, TypeError):
        return _bad_request("A valid purchase_amount is required")
    if purchase_amount <= 0:
        return _bad_request("amount must be > 0")

    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    ClickEvent.objects.get_or_create(referral=referral, visitor_id=visitor_id)
    LeadEvent.objects.get_or_create(referral=referral, visitor_id=visitor_id, defaults={"email": email})
    commission_rate = _commission_rate_for_purchase(purchase_amount)
    commission_amount = _commission_amount_for_purchase(purchase_amount)
    SaleEvent.objects.create(
        referral=referral,
        visitor_id=visitor_id,
        email=email,
        amount=commission_amount,
    )
    created = True
    referral.profile.points_total += int(purchase_amount) * SALE_POINTS_PER_DOLLAR
    referral.profile.save(update_fields=["points_total"])
    return JsonResponse(
        {
            "success": True,
            "sale_recorded": created,
            "purchase_amount": str(purchase_amount.quantize(Decimal("0.01"))),
            "commission_rate": str(commission_rate),
            "commission_amount": str(commission_amount),
            "currency": currency,
            "stats": _stats_payload(referral),
        }
    )


@require_GET
def affiliate_visitors(request):
    affiliate_id = (request.GET.get("affiliate_id") or "").strip()
    limit_raw = (request.GET.get("limit") or "100").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    try:
        limit = int(limit_raw)
    except ValueError:
        limit = 100
    limit = max(1, min(limit, 500))

    click_map = {c.visitor_id: c.created_at for c in referral.click_events.all()}
    lead_map = {l.visitor_id: l for l in referral.lead_events.all()}
    sale_map: dict[str, Decimal] = {}
    for s in referral.sale_events.all():
        sale_map[s.visitor_id] = (sale_map.get(s.visitor_id) or Decimal("0.00")) + s.amount

    visitors = []
    for vid in set(click_map.keys()) | set(lead_map.keys()) | set(sale_map.keys()):
        lead_obj = lead_map.get(vid)
        visitors.append(
            {
                "visitor_id": vid,
                "clicked_at": click_map.get(vid).isoformat() if click_map.get(vid) else None,
                "lead_email": lead_obj.email if lead_obj else None,
                "lead_at": lead_obj.created_at.isoformat() if lead_obj else None,
                "sale_amount": str(sale_map.get(vid, Decimal("0.00"))),
            }
        )
    visitors.sort(key=lambda v: v.get("lead_at") or v.get("clicked_at") or "", reverse=True)
    return JsonResponse({"affiliate_id": affiliate_id, "visitors": visitors[:limit]})


@require_GET
def funnel(request):
    affiliate_id = (request.GET.get("affiliate_id") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    click_count = referral.click_events.count()
    lead_count = referral.lead_events.count()
    sale_count = referral.sale_events.count()
    return JsonResponse(
        {
            "affiliate_id": affiliate_id,
            "stages": [
                {"stage": "Clicks", "value": click_count},
                {"stage": "Leads", "value": lead_count},
                {"stage": "Conversions", "value": sale_count},
            ],
        }
    )


@require_GET
def recent_referrals(request):
    affiliate_id = (request.GET.get("affiliate_id") or "").strip()
    limit_raw = (request.GET.get("limit") or "10").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    try:
        limit = int(limit_raw)
    except ValueError:
        limit = 10
    limit = max(1, min(limit, 50))

    click_map = {c.visitor_id: c.created_at for c in referral.click_events.all()}
    lead_map = {l.visitor_id: l for l in referral.lead_events.all()}
    sale_map: dict[str, SaleEvent] = {}
    for s in referral.sale_events.order_by("-created_at"):
        if s.visitor_id not in sale_map:
            sale_map[s.visitor_id] = s
    items = []
    for vid in set(click_map.keys()) | set(lead_map.keys()) | set(sale_map.keys()):
        lead_obj = lead_map.get(vid)
        sale_obj = sale_map.get(vid)
        at = (sale_obj.created_at if sale_obj else None) or (lead_obj.created_at if lead_obj else None) or click_map.get(vid)
        status = "purchased" if sale_obj else "joined"
        email = (sale_obj.email if sale_obj else None) or (lead_obj.email if lead_obj else None)
        items.append(
            {
                "visitor_id": vid,
                "email": email,
                "status": status,
                "at": at.isoformat() if at else None,
            }
        )
    items.sort(key=lambda x: x.get("at") or "", reverse=True)
    return JsonResponse({"affiliate_id": affiliate_id, "items": items[:limit]})


@csrf_exempt
@require_POST
def request_withdrawal(request):
    payload = _get_json(request)
    affiliate_id = str(payload.get("affiliate_id") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")

    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)

    bank_name = str(payload.get("bank_name") or "").strip()
    account_name = str(payload.get("account_name") or "").strip()
    account_number = str(payload.get("account_number") or "").strip()
    iban = str(payload.get("iban") or "").strip()
    phone_number = str(payload.get("phone_number") or "").strip()
    branch_name = str(payload.get("branch_name") or "").strip()

    if not bank_name:
        return _bad_request("bank_name is required")
    if not account_name:
        return _bad_request("account_name is required")
    if not account_number:
        return _bad_request("account_number is required")
    if not iban:
        return _bad_request("iban is required")
    if not phone_number:
        return _bad_request("phone_number is required")

    overall = _overall_stats(referral.profile)
    earnings_total = Decimal(str(overall.get("earnings_total") or "0"))
    minimum_required = Decimal("50.00")
    if earnings_total < minimum_required:
        return _bad_request("Minimum earnings of £50.00 required for withdrawal", 403)

    withdrawal = WithdrawalRequest.objects.create(
        profile=referral.profile,
        section_referral=referral,
        bank_name=bank_name,
        account_name=account_name,
        account_number=account_number,
        iban=iban,
        phone_number=phone_number,
        branch_name=branch_name,
        earnings_snapshot=earnings_total,
    )
    return JsonResponse(
        {
            "success": True,
            "withdrawal_request_id": withdrawal.id,
            "status": withdrawal.status,
            "earnings_snapshot": str(withdrawal.earnings_snapshot),
            "created_at": withdrawal.created_at.isoformat(),
        }
    )
