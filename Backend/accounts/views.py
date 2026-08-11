import html
import hashlib
import json
import logging
import random
import re
import secrets
import uuid
from datetime import timedelta
from decimal import Decimal
from urllib.parse import urlsplit

import stripe
from django.conf import settings
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from apps.affiliate_tracking.checkout_attribution import record_sale_from_checkout_metadata
from apps.affiliate_tracking.views import ensure_affiliate_profile_for_existing_user, referral_ids_payload
from apps.courses.models import Course, CourseEnrollment
from apps.portal.models import UserDashboardEntitlement, UserPlanPurchase
from apps.quiz_funnel.logic import (
  ALLOWED_BUSINESS_MODELS,
  ALLOWED_PSYCHOLOGY,
  all_free_ticket_playlist_titles,
  free_ticket_playlist_title_for_catalog,
  is_free_ticket_psychology_course,
  map_psychology_to_playlist_title,
  map_weapon_to_playlist_title,
  normalize_free_ticket_title,
)
from accounts.checkout_ownership import (
  already_owned_checkout_response,
  partition_display_items_for_user,
  user_owns_checkout_selection,
)
from accounts.stripe_checkout_helpers import (
  build_checkout_line_items,
  build_checkout_line_items_for_cart,
  checkout_session_is_paid,
  checkout_session_mode,
)
from accounts.checkout_cart import (
  cart_items_to_metadata_json,
  filter_cart_items_excluding_owned,
  parse_cart_items_from_payload,
)
from accounts.checkout_currency import resolve_checkout_currency
from accounts.checkout_guest import (
  claim_and_fulfill_guest_checkout,
  ensure_pending_signup_for_claim,
  ensure_session_is_guest_paid,
  guest_session_mode,
  guest_success_payload,
  load_unlocked_items_for_session,
  resolve_guest_line_items,
  save_guest_checkout_receipt,
  unique_pending_username,
)
from accounts.models import GuestCheckoutClaim, LoginOTP, PendingSignup, ReturningCheckout, SignupOTP
from accounts.vault_plan_catalog import (
  is_vault_course_plan_slug,
  vault_course_billing_title,
  vault_course_product_title,
)
from apps.quiz_funnel.models import Result as QuizResult
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication

from .pending_signup import (
  abandoned_pending_signup_queryset,
  complete_pending_signup,
  purge_stale_pending_signups,
  user_registered_for_email,
)
from .syndicate_otp_mailer import build_syndicate_otp_email_html, queue_syndicate_otp_html_email

logger = logging.getLogger(__name__)


def _canonical_user_for_email(email: str) -> User | None:
  """Oldest user row for this email (handles legacy duplicate User rows)."""
  e = (email or "").strip().lower()
  if not e:
    return None
  return User.objects.filter(email=e).order_by("pk").first()


def _quiz_result_for_email(email: str) -> QuizResult | None:
  e = (email or "").strip().lower()
  if not e:
    return None
  return (
    QuizResult.objects.select_related("user")
    .filter(user__email__iexact=e)
    .order_by("created_at", "id")
    .first()
  )


def _quiz_ticket_username(email: str) -> str:
  digest = hashlib.sha1((email or "").strip().lower().encode("utf-8")).hexdigest()[:12]
  return f"quiz_ticket_{digest}"


def _keyword_tokens(value: str) -> list[str]:
  raw = re.split(r"[^a-z0-9]+", (value or "").lower())
  stop = {
    "the", "and", "to", "of", "a", "ai", "with", "on", "in", "for", "course", "strategy"
  }
  return [t for t in raw if len(t) >= 3 and t not in stop]


def _courses_for_quiz_offer(offer_text: str) -> list[Course]:
  normalized = (offer_text or "").strip()
  if not normalized:
    return []
  title_candidates = [part.strip() for part in normalized.split("/") if part.strip()]
  chosen: list[Course] = []
  seen_ids: set[int] = set()
  for part in title_candidates:
    q = Course.objects.filter(is_published=True)
    for token in _keyword_tokens(part):
      q = q.filter(title__icontains=token)
    course = q.order_by("title").first()
    if not course:
      # Fallback to coarse contains search by full phrase.
      course = Course.objects.filter(is_published=True, title__icontains=part).order_by("title").first()
    if not course or course.id in seen_ids:
      continue
    seen_ids.add(course.id)
    chosen.append(course)
  return chosen


def _catalog_title_match(title: str, allowed: frozenset[str]) -> str | None:
  t = (title or "").strip().lower()
  for name in allowed:
    if name.lower() == t:
      return name
  return None


def _normalize_ticket_title(title: str) -> str:
  raw = (title or "").strip()
  if not raw:
    return raw
  weapon = _catalog_title_match(raw, ALLOWED_BUSINESS_MODELS)
  if weapon:
    return map_weapon_to_playlist_title(weapon)
  psych = _catalog_title_match(raw, ALLOWED_PSYCHOLOGY)
  if psych:
    return map_psychology_to_playlist_title(psych)
  return raw


def _existing_locked_ticket_titles_for_user(user: User) -> list[str]:
  titles: list[str] = []
  seen: set[str] = set()
  purchases = StreamPlaylistPurchase.objects.filter(
    user=user,
    status=StreamPlaylistPurchase.Status.PAID,
    stripe_session_id__startswith="quiz_ticket_",
  ).select_related("playlist")
  for row in purchases:
    title = (getattr(row.playlist, "title", "") or "").strip()
    if not title:
      continue
    key = title.lower()
    if key in seen:
      continue
    seen.add(key)
    titles.append(title)

  # For dedicated quiz-ticket users, enrollments also represent ticket locks.
  if str(getattr(user, "username", "")).startswith("quiz_ticket_"):
    for row in CourseEnrollment.objects.filter(user=user).select_related("course"):
      title = (getattr(row.course, "title", "") or "").strip()
      if not title:
        continue
      key = title.lower()
      if key in seen:
        continue
      seen.add(key)
      titles.append(title)
  return titles


def _quiz_ticket_titles_for_result(quiz_result: QuizResult) -> list[str]:
  """
  Quiz free-ticket entitlement: both Zero to 1 Million and 9 to 5 Exit Strategy.
  """
  del quiz_result  # entitlement is fixed; quiz result only gates email eligibility.
  return all_free_ticket_playlist_titles()


def _best_playlist_match_for_offer_part(part: str) -> StreamPlaylist | None:
  tokens = _keyword_tokens(part)
  qs = StreamPlaylist.objects.filter(is_published=True, is_coming_soon=False)
  candidates = list(qs)
  if not candidates:
    return None
  if not tokens:
    return candidates[0]

  def _score(title: str) -> tuple[int, int]:
    t = (title or "").lower()
    overlap = sum(1 for token in tokens if token in t)
    # Prefer tighter title lengths when overlap ties.
    distance = abs(len(t) - len(part))
    return overlap, -distance

  ranked = sorted(candidates, key=lambda p: _score(p.title), reverse=True)
  best = ranked[0]
  best_overlap = _score(best.title)[0]
  return best if best_overlap > 0 else None


def _playlists_for_quiz_offer(offer_text: str) -> list[StreamPlaylist]:
  normalized = (offer_text or "").strip()
  if not normalized:
    return []
  title_candidates = [part.strip() for part in normalized.split("/") if part.strip()]
  out: list[StreamPlaylist] = []
  seen: set[int] = set()
  for part in title_candidates:
    playlist = _best_playlist_match_for_offer_part(part)
    if not playlist or playlist.id in seen:
      continue
    seen.add(playlist.id)
    out.append(playlist)
  return out


def _courses_for_ticket_titles(ticket_titles: list[str]) -> list[Course]:
  out: list[Course] = []
  seen: set[int] = set()
  for title in ticket_titles:
    exact = Course.objects.filter(is_published=True, title__iexact=title).order_by("title").first()
    if exact is not None:
      course = exact
    else:
      fuzzy = _courses_for_quiz_offer(title)
      course = fuzzy[0] if fuzzy else None
    if not course or course.id in seen:
      continue
    seen.add(course.id)
    out.append(course)
  return out


def _playlist_for_ticket_title(title: str) -> StreamPlaylist | None:
  normalized = (title or "").strip()
  if not normalized:
    return None
  qs = StreamPlaylist.objects.filter(is_published=True, is_coming_soon=False)
  exact = qs.filter(title__iexact=normalized).order_by("title").first()
  if exact is not None:
    return exact
  mapped = free_ticket_playlist_title_for_catalog(normalized)
  if mapped and mapped.lower() != normalized.lower():
    mapped_row = qs.filter(title__iexact=mapped).order_by("title").first()
    if mapped_row is not None:
      return mapped_row
  if is_free_ticket_psychology_course(normalized):
    mapped = free_ticket_playlist_title_for_catalog(normalized)
    if mapped:
      mapped_row = qs.filter(title__iexact=mapped).order_by("title").first()
      if mapped_row is not None:
        return mapped_row
    return None
  return _best_playlist_match_for_offer_part(normalized)


def _playlists_for_ticket_titles(ticket_titles: list[str]) -> list[StreamPlaylist]:
  out: list[StreamPlaylist] = []
  seen: set[int] = set()
  for title in ticket_titles:
    playlist = _playlist_for_ticket_title(title)
    if not playlist or playlist.id in seen:
      continue
    seen.add(playlist.id)
    out.append(playlist)
  return out


def _ensure_quiz_ticket_user_and_enrollment(email: str, selected_ticket_title: str = "") -> User:
  e = (email or "").strip().lower()
  user = _canonical_user_for_email(e)
  if user is None:
    base = _quiz_ticket_username(e)
    username = base
    suffix = 2
    while User.objects.filter(username=username).exists():
      username = f"{base}_{suffix}"
      suffix += 1
    user = User(username=username, email=e)
    user.set_unusable_password()
    user.save()
  # Ticket users always stay in NONE tier and access only enrolled ticket courses.
  ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
  if ent.access_tier != UserDashboardEntitlement.AccessTier.NONE:
    ent.access_tier = UserDashboardEntitlement.AccessTier.NONE
    ent.save(update_fields=["access_tier", "updated_at"])

  quiz_result = _quiz_result_for_email(e)
  if quiz_result is None:
    return user
  existing_locked_titles = _existing_locked_ticket_titles_for_user(user)
  quiz_ticket_titles = _quiz_ticket_titles_for_result(quiz_result)
  selected_is_free_ticket = is_free_ticket_psychology_course(selected_ticket_title)
  if selected_is_free_ticket:
    ticket_titles = all_free_ticket_playlist_titles()
  elif existing_locked_titles:
    ticket_titles = existing_locked_titles
  elif selected_ticket_title.strip():
    ticket_titles = []
  else:
    ticket_titles = quiz_ticket_titles
  courses = _courses_for_ticket_titles(ticket_titles)
  playlists = _playlists_for_ticket_titles(ticket_titles)
  playlist_ids = [p.id for p in playlists]
  if quiz_result is not None:
    StreamPlaylistPurchase.objects.filter(
      user=user,
      stripe_session_id__startswith="quiz_ticket_",
    ).exclude(playlist_id__in=playlist_ids).delete()
  if str(user.username).startswith("quiz_ticket_"):
    CourseEnrollment.objects.filter(user=user).exclude(course_id__in=[c.id for c in courses]).delete()
    # Only drop synthetic quiz-ticket rows — never Stripe playlist purchases.
    StreamPlaylistPurchase.objects.filter(
      user=user,
      stripe_session_id__startswith="quiz_ticket_",
    ).exclude(playlist_id__in=playlist_ids).delete()
  for course in courses:
    CourseEnrollment.objects.get_or_create(user=user, course=course)
  for playlist in playlists:
    purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
      user=user,
      playlist=playlist,
      defaults={
        "status": StreamPlaylistPurchase.Status.PAID,
        "stripe_session_id": f"quiz_ticket_{user.id}_{playlist.id}",
        "stripe_checkout_session_id": f"quiz_ticket_{user.id}_{playlist.id}",
        "amount_paid": 0,
        "currency": settings.DEFAULT_CURRENCY,
        "paid_at": timezone.now(),
      },
    )
    if purchase.status != StreamPlaylistPurchase.Status.PAID:
      purchase.status = StreamPlaylistPurchase.Status.PAID
      purchase.amount_paid = 0
      purchase.currency = settings.DEFAULT_CURRENCY
      purchase.paid_at = timezone.now()
      purchase.save(update_fields=["status", "amount_paid", "currency", "paid_at", "updated_at"])
  return user


def _json_error(message: str, status: int = 400) -> JsonResponse:
  return JsonResponse({"error": message}, status=status)


def _sanitize_stripe_checkout_error(exc: Exception) -> str:
  """User-safe Stripe message — never echo secret keys back to the client."""
  msg = (getattr(exc, "user_message", None) or str(exc) or "").strip()
  lower = msg.lower()
  if "invalid api key" in lower:
    return "Checkout is misconfigured on the server (invalid Stripe secret key). Update STRIPE_SECRET_KEY in Railway and redeploy the backend."
  if "no such" in lower and "price" in lower:
    return "Checkout product configuration is invalid. Contact support."
  if msg:
    return re.sub(r"sk_(test|live)_[A-Za-z0-9*]+", "sk_***", msg)
  return "Stripe could not start checkout."


def _authenticate_jwt_user(request):
  try:
    auth = JWTAuthentication()
    drf_request = Request(request)
    result = auth.authenticate(drf_request)
    if result:
      return result[0]
  except Exception:
    return None
  return None


def _authenticate_checkout_user(request):
  """Bearer JWT or `Authorization: Token <key>` — matches dashboard sessions so plan upgrades work from the shell."""
  u = _authenticate_jwt_user(request)
  if u is not None:
    return u
  header = (request.META.get("HTTP_AUTHORIZATION") or "").strip()
  parts = header.split()
  if len(parts) == 2 and parts[0].lower() == "token":
    key = parts[1].strip()
    if key:
      try:
        tok = Token.objects.select_related("user").get(key=key)
        return tok.user
      except Token.DoesNotExist:
        return None
  return None


def _parse_pence_from_amount_payload(raw) -> int | None:
  if raw is None:
    return None
  s = re.sub(r"[^0-9.]", "", str(raw).strip())
  if not s:
    return None
  try:
    v = float(s)
    return int(max(50, round(v * 100)))
  except ValueError:
    return None


_PLAN_ENTITLEMENT_SLUGS = frozenset({"bundle", "king", "pawn", "knight"})
_KNIGHT_PLAN_CHECKOUT_BLOCKED = True
_PLAN_RECORDABLE_SLUGS = frozenset(
  {
    "bundle",
    "king",
    "pawn",
    "knight",
    "agentic_ai",
    "ai_content_automation",
    "trading_technical_analysis",
    "trading_scalpel_protocol",
    "trading_master_strategies",
    "trading_master_setups",
    "trading_master_secrets",
    "level1_business_psychology",
    "level1_business_models",
  }
)


def _is_recordable_plan_slug(plan: str) -> bool:
  plan = (plan or "").strip().lower()
  if plan in _PLAN_RECORDABLE_SLUGS:
    return True
  from accounts.level1_category_packs import is_level1_category_pack_slug

  if is_level1_category_pack_slug(plan):
    return True
  return is_vault_course_plan_slug(plan)


def _knight_plan_checkout_blocked(plan_raw: str) -> bool:
  if not _KNIGHT_PLAN_CHECKOUT_BLOCKED:
    return False
  p = (plan_raw or "").strip().lower()
  return p in ("king", "knight")


_PLAN_PRODUCT_TITLES = {
  "bundle": "Money Mastery — lifetime bundle",
  "king": "The Knight membership",
  "pawn": "The Pawn",
  "knight": "The Knight",
  "agentic_ai": "Agentic AI — lifetime access",
  "ai_content_automation": "AI Content Automation — lifetime access",
  "trading_technical_analysis": "Trading Advanced Technical Analysis — lifetime access",
  "trading_scalpel_protocol": "The Scalpel Protocol — lifetime access",
  "trading_master_strategies": "Strategies of a Master Trader — lifetime access",
  "trading_master_setups": "Setups of a Master Trader — lifetime access",
  "trading_master_secrets": "Secrets of a Master Trader — lifetime access",
  "level1_business_psychology": "Business Behaviour Psychology — unlock all",
  "level1_business_models": "Business Models — unlock all",
}


def _checkout_plan_label(plan: str) -> str:
  p = (plan or "").strip().lower()
  vault = vault_course_billing_title(p)
  if vault:
    return vault
  from accounts.level1_category_packs import level1_category_pack_title

  level1_title = level1_category_pack_title(p)
  if level1_title:
    return level1_title
  if p in _PLAN_PRODUCT_TITLES:
    return _PLAN_PRODUCT_TITLES[p]
  if p == "king":
    return "The Knight membership"
  if p == "bundle":
    return "Money Mastery — lifetime bundle"
  if p == "pawn":
    return "The Pawn"
  if p == "knight":
    return "The Knight"
  return "The Syndicate — checkout"


def _checkout_product_name(*, plan_raw: str, playlist_title: str | None = None) -> str:
  if playlist_title:
    return f"{playlist_title} playlist access"
  plan = (plan_raw or "").strip().lower()
  vault_name = vault_course_product_title(plan)
  if vault_name:
    return vault_name
  from accounts.level1_category_packs import level1_category_pack_title

  level1_title = level1_category_pack_title(plan)
  if level1_title:
    return level1_title
  return _PLAN_PRODUCT_TITLES.get(plan, "The Syndicate — checkout")


def _affiliate_attribution_payload(session_meta: dict) -> dict:
  plan_slug = str(session_meta.get("selected_plan", "") or "").strip().lower()
  return {
    "affiliate_id": str(session_meta.get("affiliate_id", "")).strip(),
    "visitor_id": str(session_meta.get("visitor_id", "")).strip(),
    "plan_slug": plan_slug,
    "plan_label": _checkout_plan_label(plan_slug),
  }


def _record_checkout_affiliate_sale(session, session_meta: dict, email: str, paid_amount: float, paid_currency: str) -> None:
  attr = _affiliate_attribution_payload(session_meta)
  plan_label = attr.get("plan_label") or "checkout-purchase"
  try:
    record_sale_from_checkout_metadata(
      session_id=str(getattr(session, "id", "") or ""),
      affiliate_id=attr.get("affiliate_id", ""),
      visitor_id=attr.get("visitor_id", ""),
      email=email,
      purchase_amount=paid_amount,
      currency=paid_currency,
      plan_label=plan_label,
    )
  except Exception:
    logger.exception("Checkout succeeded but affiliate sale attribution failed")


def _apply_purchased_plan(user: User, plan: str, session=None) -> None:
  from apps.portal.entitlements import apply_purchased_plan, apply_purchased_plan_from_checkout

  if session is not None:
    apply_purchased_plan_from_checkout(user, plan, session)
  else:
    apply_purchased_plan(user, plan)


def _record_user_plan_purchase(
  user: User,
  session,
  plan_sel: str,
  paid_amount: float,
  paid_currency: str,
  *,
  cart_multi: bool = False,
) -> None:
  """Persist plan checkout for dashboard billing history (Money Mastery, King, future vault offers, etc.)."""
  plan_sel = (plan_sel or "").strip().lower()
  if not _is_recordable_plan_slug(plan_sel):
    return
  sid = str(getattr(session, "id", "") or "").strip()
  if not sid:
    return
  titles = {
    "bundle": "Money Mastery (lifetime bundle)",
    "king": "The Knight",
    "pawn": "Pawn",
    "knight": "Knight",
    "agentic_ai": "Agentic AI",
    "ai_content_automation": "AI Content Automation",
    "trading_technical_analysis": "Trading Advanced Technical Analysis",
    "trading_scalpel_protocol": "The Scalpel Protocol",
    "trading_master_strategies": "Strategies of a Master Trader",
    "trading_master_setups": "Setups of a Master Trader",
    "trading_master_secrets": "Secrets of a Master Trader",
    "level1_business_psychology": "Business Behaviour Psychology — unlock all",
    "level1_business_models": "Business Models — unlock all",
  }
  try:
    amt = Decimal(str(paid_amount))
  except Exception:
    amt = Decimal("0.00")
  cur = (paid_currency or settings.DEFAULT_CURRENCY).strip().lower()[:8] or settings.DEFAULT_CURRENCY
  from accounts.checkout_cart import purchase_record_session_key

  record_sid = purchase_record_session_key(sid, plan_sel, cart_multi=cart_multi)
  UserPlanPurchase.objects.update_or_create(
    stripe_checkout_session_id=record_sid,
    defaults={
      "user": user,
      "plan_slug": plan_sel,
      "product_title": vault_course_billing_title(plan_sel) or titles.get(plan_sel, plan_sel),
      "amount_paid": amt,
      "currency": cur,
      "status": UserPlanPurchase.Status.PAID,
      "paid_at": timezone.now(),
    },
  )


def _safe_apply_plan_and_record_purchase(
  user: User,
  session,
  plan_sel: str,
  paid_amount: float,
  paid_currency: str,
  *,
  cart_multi: bool = False,
) -> None:
  if not plan_sel:
    return
  plan_sel = (plan_sel or "").strip().lower()
  if plan_sel in _PLAN_ENTITLEMENT_SLUGS:
    try:
      _apply_purchased_plan(user, plan_sel, session=session)
    except Exception:
      logger.exception("Checkout succeeded but plan entitlement update failed for user_id=%s plan=%s", user.id, plan_sel)
  try:
    _record_user_plan_purchase(user, session, plan_sel, paid_amount, paid_currency, cart_multi=cart_multi)
  except Exception:
    logger.exception("Checkout succeeded but plan purchase record write failed for user_id=%s plan=%s", user.id, plan_sel)
  from accounts.level1_category_packs import grant_level1_category_pack_playlists, is_level1_category_pack_slug

  if is_level1_category_pack_slug(plan_sel):
    try:
      grant_level1_category_pack_playlists(
        user,
        plan_sel,
        session_id=str(getattr(session, "id", "") or ""),
        paid_currency=paid_currency,
      )
    except Exception:
      logger.exception(
        "Checkout succeeded but Level 1 category unlock failed for user_id=%s plan=%s",
        user.id,
        plan_sel,
      )
  if plan_sel in _PLAN_ENTITLEMENT_SLUGS:
    try:
      from apps.portal.entitlements import reconcile_dashboard_entitlement_from_plan_purchases

      reconcile_dashboard_entitlement_from_plan_purchases(user)
    except Exception:
      logger.exception("Checkout succeeded but entitlement reconcile failed for user_id=%s", user.id)


def _safe_affiliate_referral_ids(user: User) -> dict[str, str]:
  try:
    af_profile = ensure_affiliate_profile_for_existing_user(user)
    return referral_ids_payload(af_profile)
  except Exception:
    logger.exception("Checkout succeeded but affiliate profile sync failed for user_id=%s", user.id)
    return {}


def _read_payload(request):
  try:
    return json.loads(request.body.decode("utf-8"))
  except json.JSONDecodeError:
    return None


def _generate_otp() -> str:
  return f"{random.randint(0, 999999):06d}"


def _send_login_otp_email(email: str, otp_code: str, username: str) -> None:
  expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  safe_name = html.escape(username)
  html_body = build_syndicate_otp_email_html(
    header_badge="Neural Access Node",
    greeting_line=f'Operator <span style="color:#fef3c7;">{safe_name}</span>,',
    intro_paragraph="Authentication handshake initiated. Use this access code to complete login.",
    otp_box_label="One-time Code",
    otp_code=otp_code,
    expires_minutes=expires_minutes,
    ignore_line="If you did not request this login, you can safely ignore this email.",
  )
  queue_syndicate_otp_html_email(
    email,
    "Your Syndicate login verification code",
    html_body,
    dev_log_code=otp_code,
  )


def _send_signup_otp_email(email: str, otp_code: str) -> None:
  expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  html_body = build_syndicate_otp_email_html(
    header_badge="Identity Provisioning",
    greeting_line="Welcome, operator.",
    intro_paragraph="Identity verification is required before network access is granted.",
    otp_box_label="Verification Code",
    otp_code=otp_code,
    expires_minutes=expires_minutes,
    ignore_line="If you did not request this signup, you can safely ignore this email.",
  )
  queue_syndicate_otp_html_email(
    email,
    "Your Syndicate signup verification code",
    html_body,
    dev_log_code=otp_code,
  )


def _unique_pending_username() -> str:
  for _ in range(32):
    candidate = f"syn_{secrets.token_hex(10)}"
    if not User.objects.filter(username=candidate).exists():
      return candidate
  return f"syn_{secrets.token_hex(16)}"


def _create_and_email_login_otp(email: str):
  """Create LoginOTP and send email. Returns None on success, or JsonResponse error."""
  user_by_email = _canonical_user_for_email(email)
  quiz_result = _quiz_result_for_email(email)
  if user_by_email is None and quiz_result is None:
    return _json_error("No account found for this email.", status=404)

  otp_code = _generate_otp()
  expires_at = timezone.now() + timedelta(
    minutes=getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  )
  LoginOTP.objects.update_or_create(
    email=email,
    defaults={"otp_code": otp_code, "otp_expires_at": expires_at},
  )

  username = user_by_email.username if user_by_email is not None else (email.split("@")[0] or "Operator")
  _send_login_otp_email(email=email, otp_code=otp_code, username=username)
  return None


def _create_and_email_signup_otp(email: str):
  """Create SignupOTP and send email. Returns None on success, or JsonResponse error."""
  try:
    pending_signup = PendingSignup.objects.get(email=email)
  except PendingSignup.DoesNotExist:
    return _json_error("No pending signup for this email.", status=404)

  if user_registered_for_email(email):
    complete_pending_signup(pending_signup)
    return _json_error("Email already registered. Please log in.", status=400)

  otp_code = _generate_otp()
  expires_at = timezone.now() + timedelta(
    minutes=getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  )
  SignupOTP.objects.update_or_create(
    email=email,
    defaults={"otp_code": otp_code, "otp_expires_at": expires_at},
  )

  _send_signup_otp_email(email=email, otp_code=otp_code)
  return None


@csrf_exempt
@require_POST
def signup_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  if not email:
    return _json_error("Email is required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  if User.objects.filter(email=email).exists():
    return JsonResponse(
      {
        "error": "Email already registered. Please log in.",
        "code": "USER_EXISTS",
        "email": email,
      },
      status=400,
    )

  pending, created = PendingSignup.objects.get_or_create(
    email=email,
    defaults={
      "username": _unique_pending_username(),
      "password_hash": make_password(secrets.token_urlsafe(48)),
      "is_paid": False,
      "stripe_checkout_session_id": "",
    },
  )
  if not created:
    if user_registered_for_email(email):
      complete_pending_signup(pending)
      return _json_error("This email is already registered. Please log in instead.")
    pending.stripe_checkout_session_id = ""
    pending.save(update_fields=["stripe_checkout_session_id", "updated_at"])

  SignupOTP.objects.filter(email=email).delete()
  LoginOTP.objects.filter(email=email).delete()

  signup_err = _create_and_email_signup_otp(email)
  if signup_err is not None:
    return signup_err

  return JsonResponse(
    {
      "message": "Verification code sent. Check your email to continue.",
      "email": email,
      "signup_token": str(pending.token),
      "otp_required": True,
    },
    status=200,
  )


@csrf_exempt
@require_POST
def resend_signup_otp_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  if not email:
    return _json_error("Email is required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  signup_err = _create_and_email_signup_otp(email)
  if signup_err is not None:
    return signup_err

  return JsonResponse(
    {
      "message": "A new verification code was sent to your email.",
      "email": email,
      "otp_required": True,
    },
  )


@csrf_exempt
@require_POST
def verify_signup_otp_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  otp = str(payload.get("otp", "")).strip()

  if not email or not otp:
    return _json_error("Email and OTP are required.")
  if len(otp) != 6 or not otp.isdigit():
    return _json_error("OTP must be a 6-digit code.")

  try:
    pending_signup = PendingSignup.objects.get(email=email)
  except PendingSignup.DoesNotExist:
    return _json_error("No pending signup for this email.", status=404)

  if user_registered_for_email(email):
    complete_pending_signup(pending_signup)
    return _json_error("Email already registered. Please log in.", status=400)

  try:
    signup_otp = SignupOTP.objects.get(email=email)
  except SignupOTP.DoesNotExist:
    return _json_error("Verification not requested for this email.", status=404)

  if signup_otp.otp_expires_at < timezone.now():
    signup_otp.delete()
    return _json_error("Verification code expired. Please sign up again.", status=400)

  if signup_otp.otp_code != otp:
    return _json_error("Invalid verification code.", status=400)

  signup_otp.delete()

  if User.objects.filter(username=pending_signup.username).exists():
    pending_signup.username = _unique_pending_username()
    pending_signup.save(update_fields=["username", "updated_at"])
  if User.objects.filter(email=pending_signup.email).exists():
    pending_signup.delete()
    return _json_error("Email already registered. Please log in.", status=400)

  user = User(
    username=pending_signup.username,
    email=pending_signup.email,
    password=pending_signup.password_hash,
  )
  user.save()
  complete_pending_signup(pending_signup)

  auth_token, _ = Token.objects.get_or_create(user=user)
  af_profile = ensure_affiliate_profile_for_existing_user(user)

  return JsonResponse(
    {
      "message": "Signup verified successfully.",
      "email": email,
      "token": auth_token.key,
      "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
      "user": {"id": user.id, "username": user.username, "email": user.email},
      "referral_ids": referral_ids_payload(af_profile),
    },
    status=200,
  )


def _parse_signup_token(raw: str) -> str | None:
  """Return normalized UUID string or None if missing/invalid (avoids ORM ValidationError → 500)."""
  s = (raw or "").strip()
  if not s:
    return None
  try:
    return str(uuid.UUID(s))
  except ValueError:
    return None


def _checkout_success_redirect_path(plan_slug: str = "", playlist_id: str = "") -> str:
  """In-app path after Stripe success (frontend keeps the user's current origin)."""
  plan = (plan_slug or "").strip().lower()
  pid = (playlist_id or "").strip()
  if pid.isdigit():
    return "/dashboard/programs"
  if plan in ("king", "knight"):
    return "/dashboard/resources"
  from accounts.level1_category_packs import is_level1_category_pack_slug

  if (
    plan in ("bundle", "pawn")
    or plan.startswith("agentic_ai")
    or plan.startswith("ai_content")
    or plan.startswith("trading_")
    or plan.startswith("level1_")
    or is_level1_category_pack_slug(plan)
    or is_vault_course_plan_slug(plan)
  ):
    qs = "plan_checkout=success"
    if plan:
      qs += f"&plan={plan}"
    return f"/dashboard/programs?{qs}"
  raw = (getattr(settings, "POST_LOGIN_REDIRECT_URL", "") or "").strip()
  if raw.startswith("/") and not raw.startswith("//"):
    return raw.split("#")[0] or "/dashboard/programs"
  if raw.startswith("http://") or raw.startswith("https://"):
    parsed = urlsplit(raw)
    if parsed.path and parsed.path != "/":
      return f"{parsed.path}{f'?{parsed.query}' if parsed.query else ''}"
  return "/dashboard/programs"


@csrf_exempt
@require_POST
def create_checkout_session_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  checkout_currency = resolve_checkout_currency(request, payload)

  signup_token = _parse_signup_token(str(payload.get("signup_token", "")))
  checkout_user = _authenticate_checkout_user(request) if not signup_token else None
  allow_guest = False
  if not signup_token and checkout_user is None:
    auth_header = (request.META.get("HTTP_AUTHORIZATION") or "").strip()
    if auth_header:
      return _json_error("Authentication failed. Sign in again and retry checkout.", status=401)
    raw_signup = str(payload.get("signup_token", "")).strip()
    if raw_signup:
      return _json_error("Checkout link expired or invalid. Sign up again to continue.", status=400)
    allow_guest = True

  if allow_guest:
    if not settings.STRIPE_SECRET_KEY:
      return _json_error(
        "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
        status=500,
      )
    line_items, metadata, guest_error, excluded_owned = resolve_guest_line_items(
      payload,
      currency=checkout_currency,
      parse_pence=_parse_pence_from_amount_payload,
      checkout_product_name=_checkout_product_name,
      knight_blocked=_knight_plan_checkout_blocked,
    )
    if guest_error:
      status = 403 if "coming soon" in guest_error.lower() else 400
      if "not found" in guest_error.lower():
        status = 404
      if "already own" in guest_error.lower():
        return JsonResponse(
          {
            "is_unlocked": True,
            "already_purchased": True,
            "message": guest_error,
            "excluded_owned": excluded_owned,
          },
          status=200,
        )
      return _json_error(guest_error, status=status)

    stripe.api_key = settings.STRIPE_SECRET_KEY
    frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
    requested_base = str(payload.get("return_base_url", "")).strip()
    if requested_base:
      parsed = urlsplit(requested_base)
      if parsed.scheme in ("http", "https") and bool(parsed.netloc):
        frontend_base = f"{parsed.scheme}://{parsed.netloc}"

    def _session_create_guest(pm_types: list[str]):
      return stripe.checkout.Session.create(
        mode=guest_session_mode(metadata),
        payment_method_types=pm_types,
        line_items=line_items,
        success_url=f"{frontend_base}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{frontend_base}/programs",
        custom_text={
          "submit": {"message": "The Syndicate — secure checkout"},
        },
        metadata=metadata,
      )

    pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
    try:
      session = _session_create_guest(pm_list)
    except stripe.error.InvalidRequestError as exc:
      err_txt = str(exc).lower()
      match = re.search(r"payment method type provided:\s*([a-z0-9_]+)\s+is invalid", err_txt)
      bad_type = match.group(1) if match else ""
      pm_retry = [t for t in pm_list if t != bad_type] if bad_type else [t for t in pm_list if t not in ("pay_by_bank",)]
      if not pm_retry:
        pm_retry = ["card"]
      try:
        session = _session_create_guest(pm_retry)
      except stripe.error.StripeError as exc2:
        msg = _sanitize_stripe_checkout_error(exc2)
        logger.exception("Stripe guest checkout session failed (retry): %s", msg)
        return _json_error(msg, status=400)
    except stripe.error.StripeError as exc:
      msg = _sanitize_stripe_checkout_error(exc)
      logger.exception("Stripe guest checkout session failed: %s", msg)
      return _json_error(msg, status=400)
    except Exception as exc:
      logger.exception("Guest checkout session failed")
      return _json_error(f"Unable to create checkout session: {exc}", status=500)

    if not session.url:
      return _json_error("Stripe did not return a checkout URL.", status=500)

    try:
      save_guest_checkout_receipt(session.id, payload, session_meta=metadata)
    except Exception:
      logger.exception("Failed to persist guest checkout receipt for %s", session.id)

    body = {
      "checkout_url": session.url,
      "session_id": session.id,
      "guest_checkout": True,
    }
    if excluded_owned:
      body["excluded_owned"] = excluded_owned
      body["message"] = (
        f"Removed {len(excluded_owned)} already-owned program(s) from checkout: "
        + ", ".join(excluded_owned[:5])
      )
    return JsonResponse(body, status=200)

  if checkout_user is not None:
    checkout_email = (checkout_user.email or "").strip()
    if not checkout_email:
      return _json_error("Your account has no email on file; add one before checkout.", status=400)
    metadata = {
      "checkout_kind": "logged_in",
      "user_id": str(checkout_user.pk),
      "email": checkout_email,
    }
    selected_playlist = None
    selected_playlist_id_raw = str(payload.get("playlist_id", "")).strip()
    cart_items, cart_parse_error = parse_cart_items_from_payload(payload)
    if cart_parse_error:
      return _json_error(cart_parse_error, status=400)
    if cart_items and selected_playlist_id_raw:
      return _json_error("Use either playlist checkout or unlock cart — not both.", status=400)

    if cart_items:
      cart_items, excluded_owned, cart_error = filter_cart_items_excluding_owned(checkout_user, cart_items)
      if cart_error:
        return _json_error(cart_error, status=400)
      if not cart_items:
        return JsonResponse(
          {
            "is_unlocked": True,
            "already_purchased": True,
            "message": "You already own every program in this unlock bucket.",
            "excluded_owned": excluded_owned,
          },
          status=200,
        )
      metadata["checkout_cart"] = "1"
      metadata["cart_items_json"] = cart_items_to_metadata_json(cart_items)
      first_plan = next((item.plan for item in cart_items if item.plan), "")
      if first_plan:
        metadata["selected_plan"] = first_plan
      if not settings.STRIPE_SECRET_KEY:
        return _json_error(
          "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
          status=500,
        )
      stripe.api_key = settings.STRIPE_SECRET_KEY
      frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
      requested_base = str(payload.get("return_base_url", "")).strip()
      if requested_base:
        parsed = urlsplit(requested_base)
        if parsed.scheme in ("http", "https") and bool(parsed.netloc):
          frontend_base = f"{parsed.scheme}://{parsed.netloc}"

      def _session_create_cart(pm_types: list[str]):
        return stripe.checkout.Session.create(
          mode="payment",
          customer_email=checkout_email,
          payment_method_types=pm_types,
          line_items=build_checkout_line_items_for_cart(cart_items, currency=checkout_currency),
          success_url=f"{frontend_base}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
          cancel_url=f"{frontend_base}/login",
          custom_text={
            "submit": {"message": "The Syndicate — secure checkout"},
          },
          metadata=metadata,
        )

      pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
      try:
        session = _session_create_cart(pm_list)
      except stripe.error.InvalidRequestError as exc:
        err_txt = str(exc).lower()
        match = re.search(r"payment method type provided:\s*([a-z0-9_]+)\s+is invalid", err_txt)
        bad_type = match.group(1) if match else ""
        pm_retry = [t for t in pm_list if t != bad_type] if bad_type else [t for t in pm_list if t not in ("pay_by_bank",)]
        if not pm_retry:
          pm_retry = ["card"]
        try:
          session = _session_create_cart(pm_retry)
        except stripe.error.StripeError as exc2:
          msg = _sanitize_stripe_checkout_error(exc2)
          logger.exception("Stripe cart checkout session failed (logged-in, retry): %s", msg)
          return _json_error(msg, status=400)
      except stripe.error.StripeError as exc:
        msg = _sanitize_stripe_checkout_error(exc)
        logger.exception("Stripe cart checkout session failed (logged-in): %s", msg)
        return _json_error(msg, status=400)
      except Exception as exc:
        logger.exception("Cart checkout session failed (logged-in)")
        return _json_error(f"Unable to create checkout session: {exc}", status=500)

      if not session.url:
        return _json_error("Stripe did not return a checkout URL.", status=500)

      body = {
        "checkout_url": session.url,
        "session_id": session.id,
        "cart_count": len(cart_items),
      }
      if excluded_owned:
        body["excluded_owned"] = excluded_owned
        body["message"] = (
          f"Removed {len(excluded_owned)} already-owned program(s) from checkout."
        )
      return JsonResponse(body, status=200)

    if selected_playlist_id_raw:
      if not selected_playlist_id_raw.isdigit():
        return _json_error("Invalid playlist ID.")
      selected_playlist = StreamPlaylist.objects.filter(
        id=int(selected_playlist_id_raw),
        is_published=True,
        is_coming_soon=False,
      ).first()
      if selected_playlist is None:
        return _json_error("Playlist not found.", status=404)
      if selected_playlist.price <= 0:
        return _json_error("Playlist price must be greater than 0.", status=400)
      if user_owns_checkout_selection(checkout_user, playlist=selected_playlist):
        return already_owned_checkout_response(playlist=selected_playlist)
      metadata["playlist_id"] = str(selected_playlist.id)
    plan_raw = str(payload.get("selected_plan", "")).strip().lower()
    if plan_raw:
      if _knight_plan_checkout_blocked(plan_raw):
        return _json_error(
          "The Knight membership is coming soon and is not available for purchase yet.",
          status=403,
        )
      from accounts.trading_vault_catalog import is_trading_submodule_slug

      if is_trading_submodule_slug(plan_raw):
        return _json_error(
          "Individual trading lessons are not sold separately. Unlock the module sub-pack instead.",
          status=400,
        )
      if user_owns_checkout_selection(checkout_user, plan_raw=plan_raw):
        return already_owned_checkout_response(plan_raw=plan_raw)
      metadata["selected_plan"] = plan_raw
    meta_affiliate_id = str(payload.get("affiliate_id", "")).strip()
    meta_visitor_id = str(payload.get("visitor_id", "")).strip()
    if meta_affiliate_id:
      metadata["affiliate_id"] = meta_affiliate_id
    if meta_visitor_id:
      metadata["visitor_id"] = meta_visitor_id
    if not settings.STRIPE_SECRET_KEY:
      return _json_error(
        "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
        status=500,
      )
    stripe.api_key = settings.STRIPE_SECRET_KEY
    frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
    requested_base = str(payload.get("return_base_url", "")).strip()
    if requested_base:
      parsed = urlsplit(requested_base)
      if parsed.scheme in ("http", "https") and bool(parsed.netloc):
        frontend_base = f"{parsed.scheme}://{parsed.netloc}"
    unit_amount = (
      int(max(50, round(float(selected_playlist.price) * 100)))
      if selected_playlist is not None
      else (_parse_pence_from_amount_payload(payload.get("selected_amount")) or settings.CHECKOUT_AMOUNT_PENCE)
    )
    product_name = _checkout_product_name(
      plan_raw=plan_raw,
      playlist_title=selected_playlist.title if selected_playlist is not None else None,
    )

    def _session_create_logged_in(pm_types: list[str]):
      return stripe.checkout.Session.create(
        mode=checkout_session_mode(plan_raw),
        customer_email=checkout_email,
        payment_method_types=pm_types,
        line_items=build_checkout_line_items(
          plan_raw=plan_raw,
          product_name=product_name,
          unit_amount=unit_amount,
          currency=checkout_currency,
        ),
        success_url=f"{frontend_base}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{frontend_base}/login",
        custom_text={
          "submit": {"message": "The Syndicate — secure checkout"},
        },
        metadata=metadata,
      )

    pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
    try:
      session = _session_create_logged_in(pm_list)
    except stripe.error.InvalidRequestError as exc:
      err_txt = str(exc).lower()
      match = re.search(r"payment method type provided:\s*([a-z0-9_]+)\s+is invalid", err_txt)
      bad_type = match.group(1) if match else ""
      pm_retry = [t for t in pm_list if t != bad_type] if bad_type else [t for t in pm_list if t not in ("pay_by_bank",)]
      if not pm_retry:
        pm_retry = ["card"]
      try:
        session = _session_create_logged_in(pm_retry)
      except stripe.error.StripeError as exc2:
        msg = _sanitize_stripe_checkout_error(exc2)
        logger.exception("Stripe checkout session failed (logged-in, retry): %s", msg)
        return _json_error(msg, status=400)
    except stripe.error.StripeError as exc:
      msg = _sanitize_stripe_checkout_error(exc)
      logger.exception("Stripe checkout session failed (logged-in): %s", msg)
      return _json_error(msg, status=400)
    except Exception as exc:
      logger.exception("Checkout session failed (logged-in)")
      return _json_error(f"Unable to create checkout session: {exc}", status=500)

    if not session.url:
      return _json_error("Stripe did not return a checkout URL.", status=500)

    return JsonResponse(
      {
        "checkout_url": session.url,
        "session_id": session.id,
      },
      status=200,
    )

  pending_signup = PendingSignup.objects.filter(token=signup_token).first()
  returning = None
  if pending_signup is None:
    try:
      returning = ReturningCheckout.objects.get(token=signup_token)
    except ReturningCheckout.DoesNotExist:
      return _json_error("Checkout link not found.", status=404)

  if pending_signup is not None:
    if user_registered_for_email(pending_signup.email):
      return _json_error(
        "Account is verified. Sign in and complete checkout from the dashboard or programs page.",
        status=400,
      )
    checkout_email = pending_signup.email
    metadata = {
      "signup_token": str(pending_signup.token),
      "email": checkout_email,
      "checkout_kind": "new_signup",
    }
  else:
    if not User.objects.filter(email=returning.email).exists():
      return _json_error("No account found for this checkout link.", status=404)
    checkout_email = returning.email
    metadata = {
      "returning_token": str(returning.token),
      "email": checkout_email,
      "checkout_kind": "returning",
    }

  plan_payload = str(payload.get("selected_plan", "")).strip().lower()
  if plan_payload:
    if _knight_plan_checkout_blocked(plan_payload):
      return _json_error(
        "The Knight membership is coming soon and is not available for purchase yet.",
        status=403,
      )
    metadata["selected_plan"] = plan_payload

  selected_playlist = None
  selected_playlist_id_raw = str(payload.get("playlist_id", "")).strip()
  if selected_playlist_id_raw:
    if not selected_playlist_id_raw.isdigit():
      return _json_error("Invalid playlist ID.")
    selected_playlist = StreamPlaylist.objects.filter(
      id=int(selected_playlist_id_raw),
      is_published=True,
      is_coming_soon=False,
    ).first()
    if selected_playlist is None:
      return _json_error("Playlist not found.", status=404)
    if selected_playlist.price <= 0:
      return _json_error("Playlist price must be greater than 0.", status=400)
    metadata["playlist_id"] = str(selected_playlist.id)

  # Carry affiliate attribution through Stripe metadata so checkout success can
  # reliably restore tracking even if browser local storage is unavailable.
  meta_affiliate_id = str(payload.get("affiliate_id", "")).strip()
  meta_visitor_id = str(payload.get("visitor_id", "")).strip()
  if meta_affiliate_id:
    metadata["affiliate_id"] = meta_affiliate_id
  if meta_visitor_id:
    metadata["visitor_id"] = meta_visitor_id

  existing_user = _canonical_user_for_email(checkout_email)
  if existing_user is not None and user_owns_checkout_selection(
    existing_user,
    plan_raw=plan_payload,
    playlist=selected_playlist,
  ):
    return already_owned_checkout_response(plan_raw=plan_payload, playlist=selected_playlist)

  explicit_amount = _parse_pence_from_amount_payload(payload.get("selected_amount"))
  if (
    pending_signup is not None
    and selected_playlist is None
    and not plan_payload
    and explicit_amount is None
  ):
    return _json_error(
      "No purchase selected. Verify your email, then choose a program to unlock.",
      status=400,
    )

  if not settings.STRIPE_SECRET_KEY:
    return _json_error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
      status=500,
    )

  stripe.api_key = settings.STRIPE_SECRET_KEY
  frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
  requested_base = str(payload.get("return_base_url", "")).strip()
  if requested_base:
    parsed = urlsplit(requested_base)
    if parsed.scheme in ("http", "https") and bool(parsed.netloc):
      frontend_base = f"{parsed.scheme}://{parsed.netloc}"

  unit_amount = (
    int(max(50, round(float(selected_playlist.price) * 100)))
    if selected_playlist is not None
    else (explicit_amount or settings.CHECKOUT_AMOUNT_PENCE)
  )
  product_name = _checkout_product_name(
    plan_raw=plan_payload,
    playlist_title=selected_playlist.title if selected_playlist is not None else None,
  )

  def _session_create(pm_types: list[str]):
    return stripe.checkout.Session.create(
      mode=checkout_session_mode(plan_payload),
      customer_email=checkout_email,
      payment_method_types=pm_types,
      line_items=build_checkout_line_items(
        plan_raw=plan_payload,
        product_name=product_name,
        unit_amount=unit_amount,
        currency=checkout_currency,
      ),
      success_url=f"{frontend_base}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
      cancel_url=f"{frontend_base}/signup",
      custom_text={
        "submit": {"message": "The Syndicate — secure checkout"},
      },
      metadata=metadata,
    )

  pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
  try:
    session = _session_create(pm_list)
  except stripe.error.InvalidRequestError as exc:
    err_txt = str(exc).lower()
    match = re.search(r"payment method type provided:\s*([a-z0-9_]+)\s+is invalid", err_txt)
    bad_type = match.group(1) if match else ""
    pm_retry = [t for t in pm_list if t != bad_type] if bad_type else [t for t in pm_list if t not in ("pay_by_bank",)]
    if not pm_retry:
      pm_retry = ["card"]
    try:
      session = _session_create(pm_retry)
    except stripe.error.StripeError as exc2:
      msg = _sanitize_stripe_checkout_error(exc2)
      logger.exception("Stripe checkout session failed (signup, retry): %s", msg)
      return _json_error(msg, status=400)
  except stripe.error.StripeError as exc:
    msg = _sanitize_stripe_checkout_error(exc)
    logger.exception("Stripe checkout session failed (signup): %s", msg)
    return _json_error(msg, status=400)
  except Exception:
    logger.exception("Checkout session failed (signup)")
    return _json_error("Unable to create checkout session.", status=500)
  
  if pending_signup is not None:
    pending_signup.stripe_checkout_session_id = session.id
    pending_signup.save(update_fields=["stripe_checkout_session_id", "updated_at"])
  else:
    returning.stripe_checkout_session_id = session.id
    returning.save(update_fields=["stripe_checkout_session_id", "updated_at"])

  return JsonResponse(
    {
      "checkout_url": session.url,
      "session_id": session.id,
    },
    status=200,
  )


@csrf_exempt
@require_POST
def checkout_success_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  session_id = str(payload.get("session_id", "")).strip()
  if not session_id:
    return _json_error("Session ID is required.")

  stripe.api_key = settings.STRIPE_SECRET_KEY
  try:
    session = stripe.checkout.Session.retrieve(session_id)
  except Exception:
    return _json_error("Invalid checkout session.", status=400)

  if not checkout_session_is_paid(session):
    return _json_error("Payment not completed.", status=400)
  paid_currency = str(getattr(session, "currency", settings.DEFAULT_CURRENCY) or settings.DEFAULT_CURRENCY).lower()
  paid_minor_total = int(getattr(session, "amount_total", 0) or 0)
  paid_amount = round(paid_minor_total / 100, 2)

  def _session_metadata_dict(session_obj) -> dict:
    raw = getattr(session_obj, "metadata", None)
    if not raw:
      return {}
    if isinstance(raw, dict):
      return dict(raw)
    try:
      to_dict = getattr(raw, "to_dict_recursive", None)
      if callable(to_dict):
        data = to_dict()
        return data if isinstance(data, dict) else {}
    except Exception:
      pass
    data_attr = getattr(raw, "_data", None)
    if isinstance(data_attr, dict):
      return dict(data_attr)
    result = {}
    for k in (
      "playlist_id",
      "checkout_kind",
      "user_id",
      "email",
      "signup_token",
      "returning_token",
      "affiliate_id",
      "visitor_id",
      "selected_plan",
      "selected_billing",
      "selected_amount",
      "cart_items_json",
      "checkout_cart",
    ):
      try:
        v = raw[k]  # StripeObject supports key indexing.
      except Exception:
        continue
      if v is None:
        continue
      result[str(k)] = str(v)
    return result

  pending_signup = PendingSignup.objects.filter(
    stripe_checkout_session_id=session.id,
  ).first()
  session_meta = _session_metadata_dict(session)

  if str(session_meta.get("checkout_kind", "") or "").strip() == "guest":
    # Also pull cart JSON from StripeObject if missing from dict helper.
    if "cart_items_json" not in session_meta:
      raw_meta = getattr(session, "metadata", None) or {}
      try:
        cart_json = raw_meta["cart_items_json"] if raw_meta else ""
      except Exception:
        cart_json = ""
      if cart_json:
        session_meta["cart_items_json"] = str(cart_json)
      try:
        checkout_cart = raw_meta["checkout_cart"] if raw_meta else ""
      except Exception:
        checkout_cart = ""
      if checkout_cart:
        session_meta["checkout_cart"] = str(checkout_cart)
    return JsonResponse(
      guest_success_payload(session, session_meta, paid_amount=paid_amount, paid_currency=paid_currency),
      status=200,
    )

  if pending_signup is None:
    signup_token_raw = str(session_meta.get("signup_token", "") or "").strip()
    if signup_token_raw:
      parsed_token = _parse_signup_token(signup_token_raw)
      if parsed_token:
        pending_signup = PendingSignup.objects.filter(token=parsed_token).first()
  from accounts.checkout_fulfillment import (
    checkout_success_json_response,
    fulfill_checkout_session_for_user,
    resolve_checkout_user_from_metadata,
  )

  # Ensure cart metadata is present for all fulfillment paths (StripeObject edge cases).
  if "cart_items_json" not in session_meta or "checkout_cart" not in session_meta:
    raw_meta = getattr(session, "metadata", None) or {}
    for meta_key in ("cart_items_json", "checkout_cart", "playlist_slug", "playlist_id", "selected_plan"):
      if meta_key in session_meta:
        continue
      try:
        raw_val = raw_meta[meta_key] if raw_meta else ""
      except Exception:
        raw_val = ""
      if raw_val:
        session_meta[meta_key] = str(raw_val)

  if pending_signup is not None:
    existing_user = User.objects.filter(email=pending_signup.email).first()
    if existing_user is not None:
      user = existing_user
    else:
      username = pending_signup.username
      if User.objects.filter(username=username).exists():
        username = _unique_pending_username()
        pending_signup.username = username
        pending_signup.save(update_fields=["username", "updated_at"])
      user = User(
        username=username,
        email=pending_signup.email,
        password=pending_signup.password_hash,
      )
      user.save()
    complete_pending_signup(pending_signup)
    plan_sel, playlist_id, was_recorded = fulfill_checkout_session_for_user(
      user,
      session,
      session_meta,
      paid_amount=paid_amount,
      paid_currency=paid_currency,
    )
    return checkout_success_json_response(
      user,
      session,
      session_meta,
      paid_amount=paid_amount,
      paid_currency=paid_currency,
      plan_sel=plan_sel,
      playlist_id=playlist_id,
      was_already_recorded=was_recorded,
    )

  returning = ReturningCheckout.objects.filter(
    stripe_checkout_session_id=session.id,
  ).first()
  if returning is not None:
    user = _canonical_user_for_email(returning.email)
    if user is None:
      return _json_error("No account found for this checkout email.", status=404)
    plan_sel, playlist_id, was_recorded = fulfill_checkout_session_for_user(
      user,
      session,
      session_meta,
      paid_amount=paid_amount,
      paid_currency=paid_currency,
    )
    return checkout_success_json_response(
      user,
      session,
      session_meta,
      paid_amount=paid_amount,
      paid_currency=paid_currency,
      plan_sel=plan_sel,
      playlist_id=playlist_id,
      was_already_recorded=was_recorded,
    )

  uid_raw = str(session_meta.get("user_id", "")).strip()
  checkout_kind = str(session_meta.get("checkout_kind", "")).strip().lower()
  if uid_raw.isdigit() and checkout_kind in ("logged_in", ""):
    try:
      user = User.objects.get(pk=int(uid_raw))
    except User.DoesNotExist:
      return _json_error("Account not found for this payment.", status=404)
    # Critical: multi-item cart unlocks live in cart_items_json — must use shared fulfill.
    plan_sel, playlist_id, was_recorded = fulfill_checkout_session_for_user(
      user,
      session,
      session_meta,
      paid_amount=paid_amount,
      paid_currency=paid_currency,
    )
    return checkout_success_json_response(
      user,
      session,
      session_meta,
      paid_amount=paid_amount,
      paid_currency=paid_currency,
      plan_sel=plan_sel,
      playlist_id=playlist_id,
      was_already_recorded=was_recorded,
    )

  fallback_user = resolve_checkout_user_from_metadata(session_meta)
  if fallback_user is not None:
    plan_sel, playlist_id, was_recorded = fulfill_checkout_session_for_user(
      fallback_user,
      session,
      session_meta,
      paid_amount=paid_amount,
      paid_currency=paid_currency,
    )
    return checkout_success_json_response(
      fallback_user,
      session,
      session_meta,
      paid_amount=paid_amount,
      paid_currency=paid_currency,
      plan_sel=plan_sel,
      playlist_id=playlist_id,
      was_already_recorded=was_recorded,
    )

  return _json_error("Checkout record not found for this payment.", status=404)


@csrf_exempt
@require_POST
def claim_checkout_send_otp_view(request):
  """After guest Stripe payment: send OTP so buyer can claim purchases with email."""
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  session_id = str(payload.get("session_id", "")).strip()
  email = str(payload.get("email", "")).strip().lower()
  if not session_id:
    return _json_error("Session ID is required.")
  if not email:
    return _json_error("Email is required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  stripe.api_key = settings.STRIPE_SECRET_KEY
  try:
    session = stripe.checkout.Session.retrieve(session_id)
  except Exception:
    return _json_error("Invalid checkout session.", status=400)

  session_meta = {}
  raw_meta = getattr(session, "metadata", None) or {}
  if isinstance(raw_meta, dict):
    session_meta = {str(k): str(v) for k, v in raw_meta.items() if v is not None}
  else:
    for k in ("checkout_kind", "cart_items_json", "checkout_cart", "selected_plan", "playlist_id", "affiliate_id", "visitor_id"):
      try:
        v = raw_meta[k]
      except Exception:
        continue
      if v is not None:
        session_meta[k] = str(v)

  guest_err = ensure_session_is_guest_paid(session, session_meta)
  if guest_err:
    return _json_error(guest_err, status=400)

  existing_claim = GuestCheckoutClaim.objects.filter(stripe_checkout_session_id=session.id).select_related("user").first()
  if existing_claim is not None and existing_claim.user_id:
    claimed_email = (existing_claim.email or "").strip().lower()
    if claimed_email and claimed_email != email:
      return _json_error("This purchase is already linked to another email. Please log in with that account.", status=400)
    login_err = _create_and_email_login_otp(email)
    if login_err is not None:
      return login_err
    unlocked_items = load_unlocked_items_for_session(session.id, session_meta)
    owned, claimable = partition_display_items_for_user(existing_claim.user, unlocked_items)
    return JsonResponse(
      {
        "message": "Verification code sent. Check your email to continue.",
        "email": email,
        "otp_required": True,
        "mode": "login",
        "already_claimed": True,
        "already_owned_items": owned,
        "claimable_items": claimable,
      },
      status=200,
    )

  unlocked_items = load_unlocked_items_for_session(session.id, session_meta)
  existing_user = _canonical_user_for_email(email)
  owned, claimable = partition_display_items_for_user(existing_user, unlocked_items)

  ownership_note = ""
  if owned:
    titles = [str(row.get("title") or "").strip() for row in owned if str(row.get("title") or "").strip()]
    ownership_note = (
      f" You already own {len(owned)} program(s) on this email"
      + (f" ({', '.join(titles[:3])}{'…' if len(titles) > 3 else ''})" if titles else "")
      + " — those stay linked and will not be re-charged as new unlocks."
    )

  if existing_user is not None:
    otp_code = _generate_otp()
    expires_at = timezone.now() + timedelta(minutes=getattr(settings, "OTP_EXPIRES_MINUTES", 10))
    LoginOTP.objects.update_or_create(
      email=email,
      defaults={"otp_code": otp_code, "otp_expires_at": expires_at},
    )
    _send_login_otp_email(email=email, otp_code=otp_code, username=existing_user.username)
    return JsonResponse(
      {
        "message": ("Verification code sent. Check your email to continue." + ownership_note).strip(),
        "email": email,
        "otp_required": True,
        "mode": "login",
        "already_owned_items": owned,
        "claimable_items": claimable,
      },
      status=200,
    )

  ensure_pending_signup_for_claim(email)
  SignupOTP.objects.filter(email=email).delete()
  signup_err = _create_and_email_signup_otp(email)
  if signup_err is not None:
    return signup_err

  return JsonResponse(
    {
      "message": ("Verification code sent. Check your email to unlock access." + ownership_note).strip(),
      "email": email,
      "otp_required": True,
      "mode": "signup",
      "already_owned_items": owned,
      "claimable_items": claimable,
    },
    status=200,
  )


@csrf_exempt
@require_POST
def claim_checkout_verify_otp_view(request):
  """Verify OTP after guest pay and attach purchases to the email account."""
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  session_id = str(payload.get("session_id", "")).strip()
  email = str(payload.get("email", "")).strip().lower()
  otp = str(payload.get("otp", "")).strip()
  if not session_id:
    return _json_error("Session ID is required.")
  if not email or not otp:
    return _json_error("Email and OTP are required.")
  if len(otp) != 6 or not otp.isdigit():
    return _json_error("OTP must be a 6-digit code.")

  stripe.api_key = settings.STRIPE_SECRET_KEY
  try:
    session = stripe.checkout.Session.retrieve(session_id)
  except Exception:
    return _json_error("Invalid checkout session.", status=400)

  session_meta = {}
  raw_meta = getattr(session, "metadata", None) or {}
  if isinstance(raw_meta, dict):
    session_meta = {str(k): str(v) for k, v in raw_meta.items() if v is not None}
  else:
    for k in ("checkout_kind", "cart_items_json", "checkout_cart", "selected_plan", "playlist_id", "affiliate_id", "visitor_id", "email"):
      try:
        v = raw_meta[k]
      except Exception:
        continue
      if v is not None:
        session_meta[k] = str(v)

  guest_err = ensure_session_is_guest_paid(session, session_meta)
  if guest_err:
    return _json_error(guest_err, status=400)

  paid_currency = str(getattr(session, "currency", settings.DEFAULT_CURRENCY) or settings.DEFAULT_CURRENCY).lower()
  paid_minor_total = int(getattr(session, "amount_total", 0) or 0)
  paid_amount = round(paid_minor_total / 100, 2)

  existing_claim = GuestCheckoutClaim.objects.filter(stripe_checkout_session_id=session.id).select_related("user").first()
  if existing_claim is not None and existing_claim.user_id:
    claimed_email = (existing_claim.email or "").strip().lower()
    if claimed_email and claimed_email != email:
      return _json_error("This purchase is already linked to another email.", status=400)

  user = _canonical_user_for_email(email)
  mode = "login" if user is not None else "signup"

  if mode == "login":
    try:
      login_otp = LoginOTP.objects.get(email=email)
    except LoginOTP.DoesNotExist:
      return _json_error("Verification not requested for this email.", status=404)
    if login_otp.otp_expires_at < timezone.now():
      login_otp.delete()
      return _json_error("Verification code expired. Request a new code.", status=400)
    if login_otp.otp_code != otp:
      return _json_error("Invalid verification code.", status=400)
    login_otp.delete()
  else:
    try:
      pending_signup = PendingSignup.objects.get(email=email)
    except PendingSignup.DoesNotExist:
      return _json_error("No pending signup for this email.", status=404)
    try:
      signup_otp = SignupOTP.objects.get(email=email)
    except SignupOTP.DoesNotExist:
      return _json_error("Verification not requested for this email.", status=404)
    if signup_otp.otp_expires_at < timezone.now():
      signup_otp.delete()
      return _json_error("Verification code expired. Request a new code.", status=400)
    if signup_otp.otp_code != otp:
      return _json_error("Invalid verification code.", status=400)
    signup_otp.delete()

    if User.objects.filter(username=pending_signup.username).exists():
      pending_signup.username = unique_pending_username()
      pending_signup.save(update_fields=["username", "updated_at"])
    if User.objects.filter(email=pending_signup.email).exists():
      user = _canonical_user_for_email(pending_signup.email)
      complete_pending_signup(pending_signup)
    else:
      user = User(
        username=pending_signup.username,
        email=pending_signup.email,
        password=pending_signup.password_hash,
      )
      user.save()
      complete_pending_signup(pending_signup)

  if user is None:
    return _json_error("Unable to resolve account for this email.", status=500)

  claim_and_fulfill_guest_checkout(
    user=user,
    session=session,
    session_meta=session_meta,
    paid_amount=paid_amount,
    paid_currency=paid_currency,
  )
  _record_checkout_affiliate_sale(session, session_meta, user.email, paid_amount, paid_currency)

  auth_token, _ = Token.objects.get_or_create(user=user)
  af_profile = ensure_affiliate_profile_for_existing_user(user)
  plan_sel = str(session_meta.get("selected_plan", "") or "").strip().lower()
  playlist_id = str(session_meta.get("playlist_id", "") or "").strip()

  return JsonResponse(
    {
      "message": "Access unlocked. Welcome to The Syndicate.",
      "email": user.email,
      "token": auth_token.key,
      "redirect_url": _checkout_success_redirect_path(plan_sel, playlist_id),
      "user": {"id": user.id, "username": user.username, "email": user.email},
      "referral_ids": referral_ids_payload(af_profile),
      "amount_paid": paid_amount,
      "currency": paid_currency,
      "affiliate_attribution": _affiliate_attribution_payload(session_meta),
      "selected_plan": plan_sel or None,
      "playlist_id": int(playlist_id) if playlist_id.isdigit() else None,
      "needs_claim": False,
    },
    status=200,
  )


@csrf_exempt
@require_POST
def login_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  if not email:
    return _json_error("Email is required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  from accounts.diagnosis_program_unlock import normalize_diagnosis_unlock_key

  diagnosis_key = normalize_diagnosis_unlock_key(str(payload.get("diagnosis_unlock", "") or ""))
  # Diagnosis access URLs: allow OTP for any valid email; unlock gate runs after OTP verify.
  if diagnosis_key is None:
    if _canonical_user_for_email(email) is None and _quiz_result_for_email(email) is None:
      return JsonResponse(
        {
          "error": "No account found for this email. Please sign up first.",
          "code": "SIGNUP_REQUIRED",
        },
        status=404,
      )

  login_err = _create_and_email_login_otp(email)
  if login_err is not None:
    return login_err

  return JsonResponse(
    {
      "message": "Login OTP sent to your email.",
      "email": email,
      "otp_required": True,
      "diagnosis_unlock": diagnosis_key,
    },
  )


@csrf_exempt
@require_POST
def verify_login_otp_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  otp = str(payload.get("otp", "")).strip()
  selected_ticket_title = str(payload.get("ticket", "")).strip()

  if not email or not otp:
    return _json_error("Email and OTP are required.")
  if len(otp) != 6 or not otp.isdigit():
    return _json_error("OTP must be a 6-digit code.")

  from accounts.diagnosis_program_unlock import (
    claim_diagnosis_program_unlock,
    normalize_diagnosis_unlock_key,
  )

  diagnosis_key = normalize_diagnosis_unlock_key(str(payload.get("diagnosis_unlock", "") or ""))

  user = _canonical_user_for_email(email)
  quiz_result = _quiz_result_for_email(email)
  if user is None and quiz_result is None and diagnosis_key is None:
    return _json_error("Invalid email.", status=401)

  try:
    login_otp = LoginOTP.objects.get(email=email)
  except LoginOTP.DoesNotExist:
    return _json_error("OTP not requested for this email.", status=404)

  if login_otp.otp_expires_at < timezone.now():
    login_otp.delete()
    return _json_error("OTP expired. Please login again.", status=400)

  if login_otp.otp_code != otp:
    return _json_error("Invalid OTP code.", status=400)

  login_otp.delete()

  diagnosis_payload = None
  if diagnosis_key is not None:
    diagnosis_payload = claim_diagnosis_program_unlock(email, diagnosis_key)
    if diagnosis_payload.get("status") == "unlocked":
      user = User.objects.filter(pk=diagnosis_payload["user_id"]).first() or _canonical_user_for_email(email)
    elif diagnosis_payload.get("status") == "quiz_required":
      # Always issue a portal session so the client can land on dashboard + gate overlay
      # instead of flashing a label on /login and bouncing.
      from accounts.diagnosis_program_unlock import ensure_portal_user_for_diagnosis_email

      user, _ = ensure_portal_user_for_diagnosis_email(email)
    elif diagnosis_payload.get("status") in ("invalid_program", "playlist_missing"):
      return _json_error(str(diagnosis_payload.get("detail") or "Unlock failed."), status=400)

  if quiz_result is not None and (diagnosis_payload is None or diagnosis_payload.get("status") != "unlocked"):
    # Always sync quiz-ticket entitlements for this email on successful OTP login.
    # This also covers existing non-ticket accounts so the promised free-ticket
    # playlists/courses unlock correctly in `/programs`.
    user = _ensure_quiz_ticket_user_and_enrollment(email, selected_ticket_title=selected_ticket_title)
  elif user is None:
    return _json_error("Invalid email.", status=401)

  auth_token, _ = Token.objects.get_or_create(user=user)
  af_profile = ensure_affiliate_profile_for_existing_user(user)
  redirect_url = getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/")
  if diagnosis_payload and diagnosis_payload.get("status") == "unlocked":
    redirect_url = diagnosis_payload.get("redirect_path") or f"/dashboard/programs?playlist={diagnosis_payload.get('playlist_id')}"
  elif diagnosis_payload and diagnosis_payload.get("status") == "quiz_required":
    redirect_url = diagnosis_payload.get("redirect_path") or (
      f"/dashboard/programs?diagnosis_gate=1&diagnosis_unlock={diagnosis_key}"
    )

  body = {
    "message": "Login verified successfully.",
    "token": auth_token.key,
    "redirect_url": redirect_url,
    "user": {"id": user.id, "username": user.username, "email": user.email},
    "referral_ids": referral_ids_payload(af_profile),
  }
  if diagnosis_payload is not None:
    body["diagnosis_unlock"] = diagnosis_payload
  return JsonResponse(body, status=200)


@csrf_exempt
@require_POST
def claim_diagnosis_unlock_view(request):
  """
  Already-authenticated (or email+token body) claim for diagnosis program unlock URLs.
  Body: { diagnosis_unlock, email? } — email defaults to authenticated user.
  """
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  from accounts.diagnosis_program_unlock import claim_diagnosis_program_unlock, normalize_diagnosis_unlock_key

  diagnosis_key = normalize_diagnosis_unlock_key(str(payload.get("diagnosis_unlock", "") or ""))
  if not diagnosis_key:
    return _json_error("diagnosis_unlock is required.", status=400)

  auth_user = _authenticate_checkout_user(request)
  email = str(payload.get("email", "") or "").strip().lower()
  if auth_user is not None:
    email = (auth_user.email or auth_user.username or email or "").strip().lower()
  if not email:
    return _json_error("Email is required.", status=400)

  result = claim_diagnosis_program_unlock(email, diagnosis_key)
  status_code = 200
  if result.get("status") == "invalid_program":
    status_code = 400
  elif result.get("status") == "playlist_missing":
    status_code = 404

  token_key = None
  user_payload = None
  if result.get("status") == "unlocked" and result.get("user_id"):
    try:
      user = User.objects.get(pk=int(result["user_id"]))
    except (User.DoesNotExist, TypeError, ValueError):
      user = None
    if user is not None:
      auth_token, _ = Token.objects.get_or_create(user=user)
      token_key = auth_token.key
      user_payload = {"id": user.id, "username": user.username, "email": user.email}

  return JsonResponse(
    {
      "diagnosis_unlock": result,
      "token": token_key,
      "user": user_payload,
      "redirect_url": result.get("redirect_path"),
    },
    status=status_code,
  )


@csrf_exempt
@require_POST
def stripe_webhook_view(request):
  """Extend Knight membership on Stripe subscription renewals."""
  secret = (getattr(settings, "STRIPE_WEBHOOK_SECRET", "") or "").strip()
  if not secret:
    return JsonResponse({"error": "Webhook not configured."}, status=400)
  if not settings.STRIPE_SECRET_KEY:
    return JsonResponse({"error": "Stripe not configured."}, status=400)

  stripe.api_key = settings.STRIPE_SECRET_KEY
  payload = request.body
  sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
  try:
    event = stripe.Webhook.construct_event(payload, sig_header, secret)
  except ValueError:
    return JsonResponse({"error": "Invalid payload."}, status=400)
  except stripe.error.SignatureVerificationError:
    return JsonResponse({"error": "Invalid signature."}, status=400)

  from apps.portal.commercial_access import activate_knight_subscription, default_knight_expiry_from_now
  from datetime import datetime, timezone as dt_timezone

  def _expires_from_period_end(raw_ts):
    if not raw_ts:
      return default_knight_expiry_from_now()
    return datetime.fromtimestamp(int(raw_ts), tz=dt_timezone.utc)

  def _extend_knight_by_subscription_id(sub_id: str, period_end_ts=None) -> None:
    sub_id = (sub_id or "").strip()
    if not sub_id:
      return
    ent = UserDashboardEntitlement.objects.filter(stripe_knight_subscription_id=sub_id).select_related("user").first()
    if ent is None:
      return
    activate_knight_subscription(
      ent.user,
      _expires_from_period_end(period_end_ts),
      stripe_subscription_id=sub_id,
    )

  event_type = event.get("type", "")
  data_object = event.get("data", {}).get("object", {})

  if event_type == "checkout.session.completed":
    mode = str(data_object.get("mode", "") or "").lower()
    if mode == "subscription":
      meta = data_object.get("metadata") or {}
      plan_sel = str(meta.get("selected_plan", "") or "").strip().lower()
      if plan_sel in ("king", "knight"):
        uid_raw = str(meta.get("user_id", "") or "").strip()
        sub_id = str(data_object.get("subscription", "") or "").strip()
        if uid_raw.isdigit():
          try:
            user = User.objects.get(pk=int(uid_raw))
          except User.DoesNotExist:
            user = None
          if user is not None:
            try:
              sub = stripe.Subscription.retrieve(sub_id) if sub_id else None
              period_end = getattr(sub, "current_period_end", None) if sub else None
            except Exception:
              period_end = None
            activate_knight_subscription(
              user,
              _expires_from_period_end(period_end),
              stripe_subscription_id=sub_id,
            )
    elif mode == "payment":
      # Safety net: grant one-time cart/program entitlements even if the browser
      # never hits /checkout/success. Never auto-fulfill guest sessions — OTP claim
      # must prove email ownership first.
      meta = data_object.get("metadata") or {}
      if not isinstance(meta, dict):
        meta = {}
      checkout_kind = str(meta.get("checkout_kind", "") or "").strip().lower()
      payment_status = str(data_object.get("payment_status", "") or "").strip().lower()
      session_id = str(data_object.get("id", "") or "").strip()
      if checkout_kind != "guest" and payment_status == "paid" and session_id:
        try:
          session = stripe.checkout.Session.retrieve(session_id)
          if checkout_session_is_paid(session):
            from accounts.checkout_fulfillment import (
              fulfill_checkout_session_for_user,
              resolve_checkout_user_from_metadata,
            )

            raw_session_meta = getattr(session, "metadata", None)
            if isinstance(raw_session_meta, dict):
              session_meta = {str(k): str(v) for k, v in raw_session_meta.items() if v is not None}
            elif raw_session_meta:
              session_meta = {}
              for meta_key in (
                "checkout_kind",
                "user_id",
                "email",
                "selected_plan",
                "playlist_id",
                "playlist_slug",
                "cart_items_json",
                "checkout_cart",
                "signup_token",
                "returning_token",
                "affiliate_id",
                "visitor_id",
              ):
                try:
                  raw_val = raw_session_meta[meta_key]
                except Exception:
                  raw_val = None
                if raw_val is not None:
                  session_meta[meta_key] = str(raw_val)
            else:
              session_meta = {str(k): str(v) for k, v in meta.items() if v is not None}
            if not session_meta:
              session_meta = {str(k): str(v) for k, v in meta.items() if v is not None}
            user = resolve_checkout_user_from_metadata(session_meta)
            if user is not None:
              paid_currency = str(getattr(session, "currency", settings.DEFAULT_CURRENCY) or settings.DEFAULT_CURRENCY).lower()
              paid_minor_total = int(getattr(session, "amount_total", 0) or 0)
              paid_amount = round(paid_minor_total / 100, 2)
              fulfill_checkout_session_for_user(
                user,
                session,
                session_meta,
                paid_amount=paid_amount,
                paid_currency=paid_currency,
              )
        except Exception:
          logging.getLogger(__name__).exception(
            "stripe webhook payment fulfill failed session_id=%s",
            session_id,
          )

  if event_type in ("invoice.paid", "customer.subscription.updated"):
    sub_id = str(data_object.get("subscription") or data_object.get("id") or "").strip()
    period_end = data_object.get("current_period_end")
    if event_type == "invoice.paid" and not period_end and sub_id:
      try:
        sub = stripe.Subscription.retrieve(sub_id)
        period_end = getattr(sub, "current_period_end", None)
      except Exception:
        period_end = None
    _extend_knight_by_subscription_id(sub_id, period_end)

  return JsonResponse({"received": True}, status=200)
