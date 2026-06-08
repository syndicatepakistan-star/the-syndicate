import html
import hashlib
import json
import logging
import random
import re
import secrets
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

from apps.affiliate_tracking.views import ensure_affiliate_profile_for_existing_user, referral_ids_payload
from apps.courses.models import Course, CourseEnrollment
from apps.quiz_funnel.logic import (
  ALLOWED_BUSINESS_MODELS,
  ALLOWED_PSYCHOLOGY,
  free_ticket_playlist_title_for_catalog,
  free_ticket_playlist_titles_from_stack,
  get_recommended_protocol,
  get_recommended_shield,
  is_free_ticket_psychology_course,
  map_psychology_to_playlist_title,
  map_weapon_to_playlist_title,
  normalize_free_ticket_title,
)
from apps.portal.models import UserDashboardEntitlement, UserPlanPurchase
from apps.quiz_funnel.models import Result as QuizResult
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import LoginOTP, PendingSignup, ReturningCheckout, SignupOTP
from .syndicate_otp_mailer import build_syndicate_otp_email_html, send_syndicate_otp_html_email

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
  Free-ticket flow unlocks only shield/protocol courses that are in the four-ticket catalog.
  """
  fatal_flaw = (quiz_result.virus or "").strip()
  designation = (quiz_result.category or "").strip()
  shield = get_recommended_shield(fatal_flaw)
  protocol = get_recommended_protocol(designation)
  return free_ticket_playlist_titles_from_stack(shield, protocol)


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


def _playlists_for_ticket_titles(ticket_titles: list[str]) -> list[StreamPlaylist]:
  out: list[StreamPlaylist] = []
  seen: set[int] = set()
  for title in ticket_titles:
    exact = StreamPlaylist.objects.filter(
      is_published=True, is_coming_soon=False, title__iexact=title
    ).order_by("title").first()
    playlist = exact or _best_playlist_match_for_offer_part(title)
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
    playlist_title = free_ticket_playlist_title_for_catalog(selected_ticket_title)
    if playlist_title:
      ticket_titles = list(existing_locked_titles)
      if playlist_title not in ticket_titles:
        ticket_titles.append(playlist_title)
    else:
      ticket_titles = list(existing_locked_titles)
  elif existing_locked_titles:
    ticket_titles = existing_locked_titles
  elif selected_ticket_title.strip():
    ticket_titles = []
  else:
    ticket_titles = quiz_ticket_titles
  courses = _courses_for_ticket_titles(ticket_titles)
  playlists = _playlists_for_ticket_titles(ticket_titles)
  if str(user.username).startswith("quiz_ticket_"):
    CourseEnrollment.objects.filter(user=user).exclude(course_id__in=[c.id for c in courses]).delete()
    # Keep only ticket-entitled playlist unlocks for quiz-ticket users.
    StreamPlaylistPurchase.objects.filter(user=user).exclude(playlist_id__in=[p.id for p in playlists]).delete()
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
  }
)
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
}


def _checkout_plan_label(plan: str) -> str:
  p = (plan or "").strip().lower()
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
  return _PLAN_PRODUCT_TITLES.get(plan, "The Syndicate — checkout")


def _affiliate_attribution_payload(session_meta: dict) -> dict:
  plan_slug = str(session_meta.get("selected_plan", "") or "").strip().lower()
  return {
    "affiliate_id": str(session_meta.get("affiliate_id", "")).strip(),
    "visitor_id": str(session_meta.get("visitor_id", "")).strip(),
    "plan_slug": plan_slug,
    "plan_label": _checkout_plan_label(plan_slug),
  }


def _apply_purchased_plan(user: User, plan: str) -> None:
  from apps.portal.entitlements import apply_purchased_plan

  apply_purchased_plan(user, plan)


def _record_user_plan_purchase(user: User, session, plan_sel: str, paid_amount: float, paid_currency: str) -> None:
  """Persist plan checkout for dashboard billing history (Money Mastery, King, future vault offers, etc.)."""
  plan_sel = (plan_sel or "").strip().lower()
  if plan_sel not in _PLAN_RECORDABLE_SLUGS:
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
  }
  try:
    amt = Decimal(str(paid_amount))
  except Exception:
    amt = Decimal("0.00")
  cur = (paid_currency or settings.DEFAULT_CURRENCY).strip().lower()[:8] or settings.DEFAULT_CURRENCY
  UserPlanPurchase.objects.update_or_create(
    stripe_checkout_session_id=sid,
    defaults={
      "user": user,
      "plan_slug": plan_sel,
      "product_title": titles.get(plan_sel, plan_sel),
      "amount_paid": amt,
      "currency": cur,
      "status": UserPlanPurchase.Status.PAID,
      "paid_at": timezone.now(),
    },
  )


def _safe_apply_plan_and_record_purchase(user: User, session, plan_sel: str, paid_amount: float, paid_currency: str) -> None:
  if not plan_sel:
    return
  plan_sel = (plan_sel or "").strip().lower()
  if plan_sel in _PLAN_ENTITLEMENT_SLUGS:
    try:
      _apply_purchased_plan(user, plan_sel)
    except Exception:
      logger.exception("Checkout succeeded but plan entitlement update failed for user_id=%s plan=%s", user.id, plan_sel)
  try:
    _record_user_plan_purchase(user, session, plan_sel, paid_amount, paid_currency)
  except Exception:
    logger.exception("Checkout succeeded but plan purchase record write failed for user_id=%s plan=%s", user.id, plan_sel)
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
  send_syndicate_otp_html_email(email, "Your Syndicate login verification code", html_body)


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
  send_syndicate_otp_html_email(email, "Your Syndicate signup verification code", html_body)


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

  try:
    username = user_by_email.username if user_by_email is not None else (email.split("@")[0] or "Operator")
    _send_login_otp_email(email=email, otp_code=otp_code, username=username)
  except Exception:
    logger.exception("Failed to send login OTP email to %s", email)
    if settings.DEBUG:
      print(f"[DEV OTP FALLBACK] login {email}: {otp_code}")
      return None
    return _json_error("Failed to send login OTP email.", status=500)

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
  if not created and pending.is_paid:
    return _json_error("This email is already registered. Please log in instead.")

  if not created and not pending.is_paid:
    pending.stripe_checkout_session_id = ""
    pending.save(update_fields=["stripe_checkout_session_id", "updated_at"])

  SignupOTP.objects.filter(email=email).delete()
  LoginOTP.objects.filter(email=email).delete()

  return JsonResponse(
    {
      "message": "Signup started. Continue to checkout.",
      "email": email,
      "signup_token": str(pending.token),
    },
    status=200,
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

  if pending_signup.is_paid:
    return _json_error("Checkout already completed for this email.", status=400)

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
  pending_signup.is_paid = True
  pending_signup.save(update_fields=["is_paid", "updated_at"])

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


@csrf_exempt
@require_POST
def create_checkout_session_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  signup_token = str(payload.get("signup_token", "")).strip()
  checkout_user = _authenticate_checkout_user(request) if not signup_token else None
  if not signup_token and checkout_user is None:
    return _json_error("Signup token is required.")

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
      if StreamPlaylistPurchase.objects.filter(
        user=checkout_user,
        playlist=selected_playlist,
        status=StreamPlaylistPurchase.Status.PAID,
      ).exists():
        return JsonResponse(
          {
            "is_unlocked": True,
            "playlist_id": selected_playlist.id,
            "message": "Playlist already unlocked.",
            "already_purchased": True,
          },
          status=200,
        )
      metadata["playlist_id"] = str(selected_playlist.id)
    plan_raw = str(payload.get("selected_plan", "")).strip().lower()
    if plan_raw:
      if UserPlanPurchase.objects.filter(
        user=checkout_user,
        plan_slug=plan_raw,
        status=UserPlanPurchase.Status.PAID,
      ).exists():
        return JsonResponse(
          {
            "is_unlocked": True,
            "message": "Plan already active for this account.",
            "already_purchased": True,
          },
          status=200,
        )
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
        mode="payment",
        customer_email=checkout_email,
        payment_method_types=pm_types,
        line_items=[
          {
            "price_data": {
              "currency": settings.DEFAULT_CURRENCY,
              "product_data": {"name": product_name},
              "unit_amount": unit_amount,
            },
            "quantity": 1,
          }
        ],
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
        msg = getattr(exc2, "user_message", None) or str(exc2) or "Stripe could not start checkout."
        return _json_error(msg, status=400)
    except stripe.error.StripeError as exc:
      msg = getattr(exc, "user_message", None) or str(exc) or "Stripe could not start checkout."
      return _json_error(msg, status=400)
    except Exception:
      return _json_error("Unable to create checkout session.", status=500)

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
    if pending_signup.is_paid:
      return _json_error("Checkout already completed for this account.", status=400)
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
    plan_raw=plan_payload,
    playlist_title=selected_playlist.title if selected_playlist is not None else None,
  )

  def _session_create(pm_types: list[str]):
    return stripe.checkout.Session.create(
      mode="payment",
      customer_email=checkout_email,
      payment_method_types=pm_types,
      line_items=[
        {
          "price_data": {
            "currency": settings.DEFAULT_CURRENCY,
            "product_data": {"name": product_name},
            "unit_amount": unit_amount,
          },
          "quantity": 1,
        }
      ],
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
      msg = getattr(exc2, "user_message", None) or str(exc2) or "Stripe could not start checkout."
      return _json_error(msg, status=400)
  except stripe.error.StripeError as exc:
    msg = getattr(exc, "user_message", None) or str(exc) or "Stripe could not start checkout."
    return _json_error(msg, status=400)
  except Exception:
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

  if session.payment_status != "paid":
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
    pending_signup.is_paid = True
    pending_signup.save(update_fields=["is_paid", "updated_at"])
    playlist_id = str(session_meta.get("playlist_id", "")).strip()
    if playlist_id.isdigit():
      playlist = StreamPlaylist.objects.filter(id=int(playlist_id)).first()
      if playlist is not None:
        purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
          user=user,
          playlist=playlist,
          defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "stripe_session_id": session.id,
            "stripe_checkout_session_id": session.id,
            "amount_paid": playlist.price,
            "currency": settings.DEFAULT_CURRENCY,
            "paid_at": timezone.now(),
          },
        )
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.stripe_session_id = session.id
        purchase.stripe_checkout_session_id = session.id
        purchase.amount_paid = playlist.price
        purchase.currency = settings.DEFAULT_CURRENCY
        purchase.paid_at = timezone.now()
        purchase.save(update_fields=["status", "stripe_checkout_session_id", "amount_paid", "currency", "paid_at", "updated_at"])
    plan_sel = str(session_meta.get("selected_plan", "")).strip().lower()
    _safe_apply_plan_and_record_purchase(user, session, plan_sel, paid_amount, paid_currency)
    auth_token, _ = Token.objects.get_or_create(user=user)
    referral_ids = _safe_affiliate_referral_ids(user)

    return JsonResponse(
      {
        "message": "Payment successful.",
        "email": user.email,
        "token": auth_token.key,
        "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "referral_ids": referral_ids,
        "amount_paid": paid_amount,
        "currency": paid_currency,
        "affiliate_attribution": _affiliate_attribution_payload(session_meta),
      },
      status=200,
    )

  returning = ReturningCheckout.objects.filter(
    stripe_checkout_session_id=session.id,
  ).first()
  if returning is not None:
    user = _canonical_user_for_email(returning.email)
    if user is None:
      return _json_error("No account found for this checkout email.", status=404)
    playlist_id = str(session_meta.get("playlist_id", "")).strip()
    if playlist_id.isdigit():
      playlist = StreamPlaylist.objects.filter(id=int(playlist_id)).first()
      if playlist is not None:
        purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
          user=user,
          playlist=playlist,
          defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "stripe_session_id": session.id,
            "stripe_checkout_session_id": session.id,
            "amount_paid": playlist.price,
            "currency": settings.DEFAULT_CURRENCY,
            "paid_at": timezone.now(),
          },
        )
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.stripe_session_id = session.id
        purchase.stripe_checkout_session_id = session.id
        purchase.amount_paid = playlist.price
        purchase.currency = settings.DEFAULT_CURRENCY
        purchase.paid_at = timezone.now()
        purchase.save(update_fields=["status", "stripe_checkout_session_id", "amount_paid", "currency", "paid_at", "updated_at"])
    plan_sel = str(session_meta.get("selected_plan", "")).strip().lower()
    _safe_apply_plan_and_record_purchase(user, session, plan_sel, paid_amount, paid_currency)
    auth_token, _ = Token.objects.get_or_create(user=user)
    referral_ids = _safe_affiliate_referral_ids(user)
    return JsonResponse(
      {
        "message": "Payment successful. Thank you for your purchase.",
        "email": returning.email,
        "token": auth_token.key,
        "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "referral_ids": referral_ids,
        "amount_paid": paid_amount,
        "currency": paid_currency,
        "affiliate_attribution": _affiliate_attribution_payload(session_meta),
      },
      status=200,
    )

  uid_raw = str(session_meta.get("user_id", "")).strip()
  checkout_kind = str(session_meta.get("checkout_kind", "")).strip().lower()
  if uid_raw.isdigit() and checkout_kind == "logged_in":
    try:
      user = User.objects.get(pk=int(uid_raw))
    except User.DoesNotExist:
      return _json_error("Account not found for this payment.", status=404)
    playlist_id = str(session_meta.get("playlist_id", "")).strip()
    if playlist_id.isdigit():
      playlist = StreamPlaylist.objects.filter(id=int(playlist_id)).first()
      if playlist is not None:
        purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
          user=user,
          playlist=playlist,
          defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "stripe_session_id": session.id,
            "stripe_checkout_session_id": session.id,
            "amount_paid": playlist.price,
            "currency": settings.DEFAULT_CURRENCY,
            "paid_at": timezone.now(),
          },
        )
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.stripe_session_id = session.id
        purchase.stripe_checkout_session_id = session.id
        purchase.amount_paid = playlist.price
        purchase.currency = settings.DEFAULT_CURRENCY
        purchase.paid_at = timezone.now()
        purchase.save(update_fields=["status", "stripe_checkout_session_id", "amount_paid", "currency", "paid_at", "updated_at"])
    plan_sel = str(session_meta.get("selected_plan", "")).strip().lower()
    _safe_apply_plan_and_record_purchase(user, session, plan_sel, paid_amount, paid_currency)
    auth_token, _ = Token.objects.get_or_create(user=user)
    referral_ids = _safe_affiliate_referral_ids(user)
    return JsonResponse(
      {
        "message": "Payment successful.",
        "email": user.email,
        "token": auth_token.key,
        "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "referral_ids": referral_ids,
        "amount_paid": paid_amount,
        "currency": paid_currency,
        "affiliate_attribution": _affiliate_attribution_payload(session_meta),
      },
      status=200,
    )

  return _json_error("Checkout record not found for this payment.", status=404)


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

  user = _canonical_user_for_email(email)
  quiz_result = _quiz_result_for_email(email)
  if user is None and quiz_result is None:
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
  if quiz_result is not None:
    # Always sync quiz-ticket entitlements for this email on successful OTP login.
    # This also covers existing non-ticket accounts so the promised free-ticket
    # playlists/courses unlock correctly in `/programs`.
    user = _ensure_quiz_ticket_user_and_enrollment(email, selected_ticket_title=selected_ticket_title)
  elif user is None:
    return _json_error("Invalid email.", status=401)
  auth_token, _ = Token.objects.get_or_create(user=user)
  af_profile = ensure_affiliate_profile_for_existing_user(user)
  return JsonResponse(
    {
      "message": "Login verified successfully.",
      "token": auth_token.key,
      "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
      "user": {"id": user.id, "username": user.username, "email": user.email},
      "referral_ids": referral_ids_payload(af_profile),
    },
    status=200,
  )
