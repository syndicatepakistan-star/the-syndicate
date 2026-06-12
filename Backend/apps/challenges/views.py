"""REST API for challenges and referral streak restore."""
from __future__ import annotations

import re
import secrets
import time
from datetime import timedelta, datetime
from urllib.parse import quote

from django.contrib.auth import get_user_model
from django.db.utils import OperationalError
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import MindsetKnowledge

from .models import (
    AdminAssignedTask,
    AdminTaskSubmission,
    GeneratedChallenge,
    LeaderboardEntry,
    ReferralRestore,
    SyndicateUserProgress,
)

ADMIN_TASK_MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024
from .device_batch_async import (
    device_generation_lock,
    is_device_generation_inflight,
    start_device_ai_batch_phase2,
)
from apps.portal.api_guards import require_knight_tier_response
from .services import (
    DAILY_SYSTEM_BATCH_SIZE,
    create_user_custom_challenge,
    device_batch_is_phase1_energetic_only,
    ensure_category_pair,
    ensure_daily_challenges,
    ensure_daily_challenges_for_device,
    generate_challenges,
    generate_device_ai_batch_phase_energetic_parallel,
    get_today_device_system_rows,
    prune_stale_syndicate_daily_rows,
    run_generate,
    enrich_mission_score_with_agent_attestation,
    evaluate_mission_validity_with_agent,
    resolve_mission_response_text,
    score_mission_response_after_validation,
    serialize_challenge_row,
)

def _user_device_key(request) -> str:
    """Per-account device id when logged in; empty when anonymous (shared legacy daily batch path)."""
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        return f"user:{user.pk}"
    return ""


def _prune_old_challenge_rows() -> None:
    """Remove prior-calendar-day AI challenges and quotes; keep user-created custom missions."""
    prune_stale_syndicate_daily_rows()


def _normalize_streak_on_read(obj: SyndicateUserProgress, today) -> None:
    """If the user missed at least one calendar day of activity, reset streak and keep restore hints in JSON state."""
    last = obj.last_activity_date
    if last is None or obj.streak_count <= 0:
        return
    if (today - last).days < 2:
        return
    cur = dict(obj.state or {})
    # Always refresh on a new normalization so stale JSON cannot show an old "was X" after a later break.
    cur["streak_before_break"] = str(obj.streak_count)
    cur["streak_break_date"] = today.isoformat()
    obj.streak_count = 0
    obj.state = cur
    obj.save(update_fields=["streak_count", "state", "updated_at"])


USER_LEADERBOARD_ID_RE = re.compile(r"^user:(\d+)$")


# Keys mirrored in frontend `syndicateProgressSync.ts` (excludes per-browser `device_id`).
SYNDICATE_ALLOWED_STATE_KEYS = frozenset(
    {
        "points_history_v1",
        "challenge_day_v1",
        "completed_challenge_ids",
        "points_total",
        "challenge_responses",
        "mission_started_at_v1",
        "redeemed_rewards_v1",
        "pounds_balance_v1",
        "mission_scores_v1",
        "mission_awarded_points_v1",
        "mission_completion_log_v1",
        "mission_missed_log_v1",
        "streak_before_break",
        "streak_break_date",
        "display_name",
        "profile_image_url",
        "mission_reminders_v1",
    }
)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def syndicate_progress(request):
    """GET/PATCH user progress with DB-backed streak, points_total, and level."""
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    if request.method == "GET":
        obj, _ = SyndicateUserProgress.objects.get_or_create(
            user=request.user,
            defaults={"state": {}, "points_total": 0, "level": 0, "streak_count": 0, "last_activity_date": None},
        )
        today = timezone.localdate()
        _normalize_streak_on_read(obj, today)
        obj.refresh_from_db()
        return Response(
            {
                "state": obj.state or {},
                "points_total": int(obj.points_total or 0),
                "level": int(obj.level or 0),
                "streak_count": obj.streak_count,
                "last_activity_date": obj.last_activity_date.isoformat() if obj.last_activity_date else None,
            }
        )

    incoming = request.data.get("state")
    if not isinstance(incoming, dict):
        return Response({"detail": "state must be an object"}, status=status.HTTP_400_BAD_REQUEST)

    obj, _ = SyndicateUserProgress.objects.get_or_create(
        user=request.user,
        defaults={"state": {}, "points_total": 0, "level": 0, "streak_count": 0, "last_activity_date": None},
    )
    cur = dict(obj.state or {})
    for k, v in incoming.items():
        if k not in SYNDICATE_ALLOWED_STATE_KEYS:
            continue
        if v is None:
            cur.pop(k, None)
        elif isinstance(v, str):
            cur[k] = v
        else:
            cur[k] = str(v)
    pts_raw = cur.get("points_total", "0")
    try:
        points_total = max(0, min(int(str(pts_raw)), 2_000_000_000))
    except (TypeError, ValueError):
        points_total = 0
    # Backend-safe level persistence derived from points. (Frontend can still render richer tier labels.)
    level = max(0, points_total // 20)

    obj.state = cur
    obj.points_total = points_total
    obj.level = level
    obj.save(update_fields=["state", "points_total", "level", "updated_at"])
    return Response(
        {
            "state": obj.state,
            "points_total": int(obj.points_total or 0),
            "level": int(obj.level or 0),
            "streak_count": obj.streak_count,
            "last_activity_date": obj.last_activity_date.isoformat() if obj.last_activity_date else None,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def syndicate_streak_record(request):
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    """
    Call once when the user completes their first mission of a calendar day.
    Rules: consecutive days → streak+1; missed ≥1 day → streak resets to 1 for today (chain restarted).
    """
    today = timezone.localdate()
    raw = request.data.get("activity_date")
    if raw:
        try:
            today = datetime.strptime(str(raw)[:10], "%Y-%m-%d").date()
        except ValueError:
            pass

    with transaction.atomic():
        obj, _ = SyndicateUserProgress.objects.select_for_update().get_or_create(
            user=request.user,
            defaults={"state": {}, "streak_count": 0, "last_activity_date": None},
        )
        if obj.last_activity_date == today:
            return Response(
                {
                    "ok": True,
                    "streak_count": obj.streak_count,
                    "last_activity_date": obj.last_activity_date.isoformat(),
                }
            )
        if obj.last_activity_date is None:
            obj.streak_count = 1
        else:
            delta = (today - obj.last_activity_date).days
            if delta == 1:
                obj.streak_count += 1
            else:
                obj.streak_count = 1
        obj.last_activity_date = today
        obj.save(update_fields=["streak_count", "last_activity_date", "updated_at"])

    return Response(
        {
            "ok": True,
            "streak_count": obj.streak_count,
            "last_activity_date": obj.last_activity_date.isoformat(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def syndicate_streak_restore(request):
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    """After referral streak restore: set streak on the server and clear break hints in JSON state."""
    try:
        n = int(request.data.get("streak_count", 1))
    except (TypeError, ValueError):
        n = 1
    n = max(1, min(n, 999))
    obj, _ = SyndicateUserProgress.objects.get_or_create(
        user=request.user,
        defaults={"state": {}, "streak_count": 0, "last_activity_date": None},
    )
    cur = dict(obj.state or {})
    cur.pop("streak_before_break", None)
    cur.pop("streak_break_date", None)
    # Treat restore as today's activity so the next progress read cannot immediately
    # normalize the streak back to zero due to an old break-day timestamp.
    today = timezone.localdate()
    obj.streak_count = n
    obj.last_activity_date = today
    obj.state = cur
    obj.save(update_fields=["streak_count", "last_activity_date", "state", "updated_at"])
    return Response(
        {
            "ok": True,
            "state": obj.state or {},
            "streak_count": obj.streak_count,
            "last_activity_date": obj.last_activity_date.isoformat() if obj.last_activity_date else None,
        }
    )


@api_view(["GET", "POST"])
def challenge_list_create(request):
    """
    GET: today's daily batch (same as /today/).
    POST: body with `mood` for one challenge, or `regenerate_daily` / `force` for daily batch.
    """
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    if request.method == "GET":
        return challenges_today(request)
    mood = (request.data.get("mood") or "").strip()
    if mood:
        return generate_challenge(request)
    if request.data.get("regenerate_daily") or request.data.get("force"):
        return challenges_generate_daily(request)
    return Response(
        {"detail": "Provide `mood` (string) or `regenerate_daily` / `force` for daily batch."},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
def generate_challenge(request):
    """Body: { mood: string }. Uses latest ingested mindsets."""
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    mood = (request.data.get("mood") or "").strip()
    ok, data, err = run_generate(mood)
    if not ok:
        code = status.HTTP_400_BAD_REQUEST if err in ("mood is required", "Ingest a document first.") else status.HTTP_503_SERVICE_UNAVAILABLE
        if err and "OPENAI_API_KEY" in err:
            code = status.HTTP_503_SERVICE_UNAVAILABLE
        elif err and err not in ("mood is required", "Ingest a document first."):
            code = status.HTTP_502_BAD_GATEWAY
        return Response({"detail": err}, status=code)

    return Response(data)


@api_view(["POST"])
def generate_challenges_view(request):
    """
    Body: { "mood": "energetic"|"happy"|"sad"|"tired", "category": "business"|... }
    Returns 2 validated challenges (title, description, mood, category).

    If `category` is omitted or blank, delegates to legacy single-challenge generate (mood only).
    """
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    category = (request.data.get("category") or "").strip()
    if not category:
        return generate_challenge(request)

    mood = (request.data.get("mood") or "").strip()
    if not mood:
        return Response({"detail": "mood is required when category is provided"}, status=status.HTTP_400_BAD_REQUEST)

    device_id = (request.data.get("device_id") or "").strip()
    ok, results, err = generate_challenges(mood, category, device_id=device_id)
    if not ok:
        detail = err or "Failed"
        if detail in ("Invalid mood. Use: energetic, happy, tired.", "Invalid category.", "Ingest a document first."):
            code = status.HTTP_400_BAD_REQUEST
        elif detail and "OPENAI_API_KEY" in detail:
            code = status.HTTP_503_SERVICE_UNAVAILABLE
        else:
            code = status.HTTP_502_BAD_GATEWAY
        return Response({"detail": detail}, status=code)

    return Response({"results": results})


@api_view(["GET"])
def challenge_history(request):
    qs = GeneratedChallenge.objects.order_by("-created_at")[:50]
    return Response(
        [
            {
                "id": c.id,
                "mood": c.mood,
                "title": (c.payload or {}).get("challenge_title"),
                "created_at": c.created_at.isoformat(),
            }
            for c in qs
        ]
    )


@api_view(["GET"])
def challenges_recent(request):
    """Full challenge payloads for UI (newest first)."""
    try:
        limit = min(int(request.query_params.get("limit", 10)), 50)
    except ValueError:
        limit = 10
    qs = GeneratedChallenge.objects.order_by("-created_at")[:limit]
    return Response({"results": [serialize_challenge_row(c) for c in qs]})


@api_view(["GET"])
def challenges_today(request):
    """Today's daily batch (system missions per user) plus custom missions."""
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    _prune_old_challenge_rows()
    if not MindsetKnowledge.objects.exists():
        return Response({"results": [], "detail": "No mindsets loaded yet."})
    device_id = _user_device_key(request)
    today = timezone.localdate()

    if not device_id:
        ok, rows, err = ensure_daily_challenges(force_regenerate=False)
        if not ok:
            return Response({"results": [], "detail": err or "Failed"}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({"results": rows, "batch_complete": True, "generating": False})

    qs_sys = GeneratedChallenge.objects.filter(
        challenge_date=today,
        creator_device="",
        device_batch_device_id=device_id,
    )
    n = qs_sys.count()

    if n >= DAILY_SYSTEM_BATCH_SIZE:
        rows = get_today_device_system_rows(device_id)
        extras = GeneratedChallenge.objects.filter(challenge_date=today, creator_device=device_id).order_by("slot", "id")
        rows = list(rows) + [serialize_challenge_row(c) for c in extras]
        return Response({"results": rows, "batch_complete": True, "generating": False})

    if 0 < n < DAILY_SYSTEM_BATCH_SIZE:
        if is_device_generation_inflight(device_id, today):
            rows = get_today_device_system_rows(device_id)
        elif device_batch_is_phase1_energetic_only(device_id=device_id, today=today):
            start_device_ai_batch_phase2(device_id, request.user.id)
            rows = get_today_device_system_rows(device_id)
        else:
            with device_generation_lock(device_id, today):
                GeneratedChallenge.objects.filter(
                    challenge_date=today,
                    creator_device="",
                    device_batch_device_id=device_id,
                ).delete()
                ok_p1, err_p1 = generate_device_ai_batch_phase_energetic_parallel(device_id, request.user.id)
            if not ok_p1:
                return Response(
                    {"results": [], "detail": err_p1 or "Failed to generate missions."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            start_device_ai_batch_phase2(device_id, request.user.id)
            rows = get_today_device_system_rows(device_id)
        extras = GeneratedChallenge.objects.filter(challenge_date=today, creator_device=device_id).order_by("slot", "id")
        rows = list(rows) + [serialize_challenge_row(c) for c in extras]
        return Response({"results": rows, "batch_complete": False, "generating": True})

    with device_generation_lock(device_id, today):
        qs_inner = GeneratedChallenge.objects.filter(
            challenge_date=today,
            creator_device="",
            device_batch_device_id=device_id,
        )
        n_inner = qs_inner.count()
        if n_inner >= DAILY_SYSTEM_BATCH_SIZE:
            rows = get_today_device_system_rows(device_id)
            extras = GeneratedChallenge.objects.filter(
                challenge_date=today, creator_device=device_id
            ).order_by("slot", "id")
            rows = list(rows) + [serialize_challenge_row(c) for c in extras]
            return Response({"results": rows, "batch_complete": True, "generating": False})
        if n_inner > 0:
            if not device_batch_is_phase1_energetic_only(device_id=device_id, today=today):
                qs_inner.delete()
                n_inner = 0
        if n_inner == 0:
            ok_p1, err_p1 = generate_device_ai_batch_phase_energetic_parallel(device_id, request.user.id)
            if not ok_p1:
                return Response(
                    {"results": [], "detail": err_p1 or "Failed to generate missions."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

    start_device_ai_batch_phase2(device_id, request.user.id)
    rows = get_today_device_system_rows(device_id)
    extras = GeneratedChallenge.objects.filter(challenge_date=today, creator_device=device_id).order_by("slot", "id")
    rows = list(rows) + [serialize_challenge_row(c) for c in extras]
    return Response({"results": rows, "batch_complete": False, "generating": True})


@api_view(["POST"])
def challenges_user_custom(request):
    """
    Create a user task for today (max 2 per device per day).
    Body: { device_id?, title, difficulty: easy|medium|hard }.
    Logged-in users use ``user:<pk>``; anonymous clients must pass ``device_id``.
    Points are random 3–5; agent fills description, examples, benefits; a short mindset note is appended for this device.
    """
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    if not MindsetKnowledge.objects.exists():
        return Response({"detail": "Ingest a document first."}, status=status.HTTP_400_BAD_REQUEST)
    device_id = _user_device_key(request) or (request.data.get("device_id") or "").strip()
    title = (request.data.get("title") or "").strip()
    difficulty = (request.data.get("difficulty") or "").strip()
    ok, row, err = create_user_custom_challenge(device_id, title, difficulty)
    if not ok:
        detail = err or "Failed"
        if detail in (
            "device_id required",
            "Title must be 3–220 characters.",
            "Title too short",
            "difficulty must be easy, medium, or hard.",
            "Maximum 2 custom missions per calendar day.",
            "Ingest a document first.",
        ):
            code = status.HTTP_400_BAD_REQUEST
        elif detail and "OPENAI_API_KEY" in detail:
            code = status.HTTP_503_SERVICE_UNAVAILABLE
        else:
            code = status.HTTP_502_BAD_GATEWAY
        return Response({"detail": detail}, status=code)
    return Response({"result": row})


@api_view(["POST"])
def challenges_generate_pair(request):
    """Replace today with 2 challenges for one category. Body: { category: string }."""
    if not MindsetKnowledge.objects.exists():
        return Response({"detail": "Ingest a document first."}, status=status.HTTP_400_BAD_REQUEST)
    category = (request.data.get("category") or "").strip().lower()
    device_id = _user_device_key(request)
    ok, rows, err = ensure_category_pair(category, device_batch_device_id=device_id)
    if not ok:
        code = status.HTTP_503_SERVICE_UNAVAILABLE if err and "OPENAI_API_KEY" in (err or "") else status.HTTP_400_BAD_REQUEST
        if err == "Invalid category":
            code = status.HTTP_400_BAD_REQUEST
        elif err and err not in ("Invalid category", "Ingest a document first."):
            code = status.HTTP_502_BAD_GATEWAY
        return Response({"detail": err}, status=code)
    return Response({"results": rows})


@api_view(["GET"])
def leaderboard_list(request):
    """Top 10 registered accounts by points (``device_id`` = ``user:<pk>``)."""
    User = get_user_model()
    qs = list(
        LeaderboardEntry.objects.filter(device_id__startswith="user:")
        .order_by("-points_total", "-updated_at")[:10]
    )
    user_ids: list[int] = []
    for e in qs:
        m = USER_LEADERBOARD_ID_RE.match(e.device_id)
        if m:
            user_ids.append(int(m.group(1)))
    users_by_id = {u.id: u for u in User.objects.filter(pk__in=user_ids)} if user_ids else {}
    results = []
    for i, e in enumerate(qs):
        m = USER_LEADERBOARD_ID_RE.match(e.device_id)
        uid = int(m.group(1)) if m else None
        u = users_by_id.get(uid) if uid is not None else None
        dn = (e.display_name or "").strip()
        if u is not None:
            email = (getattr(u, "email", None) or "").strip()
            if not dn or dn.lower() == "anonymous":
                raw = email or (getattr(u, "username", None) or "").strip()
                dn = raw.split("@")[0] if raw else "Player"
            seed = quote(f"u{u.id}-{email or u.username}", safe="")
        else:
            seed = quote(e.device_id, safe="")
        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf"
        results.append(
            {
                "rank": i + 1,
                "user_id": uid,
                "display_name": dn[:64] if dn else "Player",
                "points_total": e.points_total,
                "updated_at": e.updated_at.isoformat(),
                "avatar_url": avatar_url,
            }
        )
    return Response({"results": results})


@api_view(["POST"])
def leaderboard_sync(request):
    """Upsert this account's score for the leaderboard (one row per authenticated user)."""
    device = _user_device_key(request)
    try:
        pts = int(request.data.get("points_total", 0))
    except (TypeError, ValueError):
        pts = 0
    pts = max(0, min(pts, 2_000_000_000))
    name = (request.data.get("display_name") or "").strip()
    if not name or name.lower() == "anonymous":
        raw = (getattr(request.user, "email", None) or getattr(request.user, "username", None) or "").strip()
        name = raw.split("@")[0] if raw else "Anonymous"
    if len(name) > 64:
        name = name[:64]
    # SQLite can briefly lock under overlapping writes (progress sync + leaderboard sync).
    # Retry a few short times so frontend doesn't receive a noisy 500.
    obj = None
    for attempt in range(3):
        try:
            obj, _created = LeaderboardEntry.objects.update_or_create(
                device_id=device,
                defaults={"points_total": pts, "display_name": name},
            )
            break
        except OperationalError as exc:
            if "database is locked" not in str(exc).lower() or attempt == 2:
                return Response({"detail": "Temporary DB lock. Retry shortly."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            time.sleep(0.15 * (attempt + 1))
    if obj is None:
        return Response({"detail": "Temporary DB lock. Retry shortly."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response(
        {
            "ok": True,
            "points_total": obj.points_total,
            "display_name": obj.display_name,
        }
    )


@api_view(["POST"])
def challenges_generate_daily(request):
    """Regenerate today's system batch (5 categories × 3 moods = 15). Body: { force: true, device_id?: string }."""
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    if not MindsetKnowledge.objects.exists():
        return Response({"detail": "Ingest a document first."}, status=status.HTTP_400_BAD_REQUEST)
    force = bool(request.data.get("force", False))
    device_id = _user_device_key(request)
    if device_id:
        ok, rows, err = ensure_daily_challenges_for_device(device_id, force_regenerate=force, user=request.user)
    else:
        ok, rows, err = ensure_daily_challenges(force_regenerate=force)
    if not ok:
        code = status.HTTP_503_SERVICE_UNAVAILABLE if err and "OPENAI_API_KEY" in (err or "") else status.HTTP_502_BAD_GATEWAY
        return Response({"detail": err}, status=code)
    return Response({"results": rows})


@api_view(["POST"])
def mission_score_response(request):
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    """
    Evaluation agent (OpenAI) runs **first** and sets ``is_valid``. Invalid responses get
    zero points; time and numeric rubric are **not** applied. If valid, a deterministic
    accuracy rubric runs, then time as a secondary multiplicative bonus only. Optional
    attestation enriches the result when ``OPENAI_API_KEY`` is set.

    Body: ``completion_how`` and ``completion_learned`` (both required for the dashboard;
    combined for scoring), or legacy ``response_text`` only. Optional: ``challenge_description``,
    ``example_tasks``.
    """
    response_text, body_err = resolve_mission_response_text(request.data)
    if body_err:
        return Response({"detail": body_err}, status=status.HTTP_400_BAD_REQUEST)
    title = (request.data.get("challenge_title") or "").strip()
    difficulty = (request.data.get("difficulty") or "").strip().lower()
    try:
        max_points = int(request.data.get("max_points", 0))
    except (TypeError, ValueError):
        max_points = 0
    try:
        elapsed_seconds = int(request.data.get("elapsed_seconds", 0))
    except (TypeError, ValueError):
        elapsed_seconds = 0

    if not title:
        return Response({"detail": "challenge_title is required"}, status=status.HTTP_400_BAD_REQUEST)
    if max_points < 0:
        max_points = 0

    challenge_description = (request.data.get("challenge_description") or "").strip()
    example_tasks_raw = request.data.get("example_tasks")
    example_tasks: list[str] = []
    if isinstance(example_tasks_raw, list):
        example_tasks = [str(x).strip() for x in example_tasks_raw[:8] if str(x).strip()]

    diff = difficulty or "medium"
    agent_validation = evaluate_mission_validity_with_agent(
        title=title,
        response_text=response_text,
        difficulty=diff,
        challenge_description=challenge_description,
        example_tasks=example_tasks,
    )
    if not agent_validation.get("is_valid"):
        return Response(
            {
                "is_valid": False,
                "awarded_points": 0,
                "max_points": max_points,
                "score_ratio": 0.0,
                "accuracy_ratio": None,
                "agent_validation": agent_validation,
                "breakdown": None,
                "agent_attestation": None,
            }
        )

    scored = score_mission_response_after_validation(
        title=title,
        response_text=response_text,
        elapsed_seconds=max(0, elapsed_seconds),
        max_points=max_points,
        difficulty=diff,
    )
    scored["is_valid"] = True
    scored["agent_validation"] = agent_validation
    scored = enrich_mission_score_with_agent_attestation(
        scored,
        title=title,
        response_text=response_text,
        difficulty=diff,
        challenge_description=challenge_description,
        example_tasks=example_tasks,
    )
    return Response(scored)


@api_view(["POST"])
def referral_create(request):
    """Create a unique invite code (valid 7 days) for streak restore."""
    device = _user_device_key(request)
    now = timezone.now()
    ReferralRestore.objects.filter(creator_device=device, redeemed=False, expires_at__gte=now).delete()
    code = f"SYN-{secrets.token_hex(5).upper()}"
    expires = now + timedelta(days=7)
    r = ReferralRestore.objects.create(code=code, creator_device=device, expires_at=expires)
    return Response({"code": r.code, "expires_at": r.expires_at.isoformat()})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def referral_redeem(request):
    """Friend redeems a code (cannot be your own, one redeem per account)."""
    code = (request.data.get("code") or "").strip().upper()
    device = _user_device_key(request)
    if not code:
        return Response({"detail": "code required"}, status=status.HTTP_400_BAD_REQUEST)
    if not device:
        return Response({"detail": "Login required"}, status=status.HTTP_401_UNAUTHORIZED)
    # Enforce one lifetime referral redeem per authenticated account.
    if ReferralRestore.objects.filter(redeemer_device=device, redeemed=True).exists():
        return Response(
            {"detail": "This account has already redeemed a referral code"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    # Only fresh/new accounts can redeem referral restore codes.
    progress = SyndicateUserProgress.objects.filter(user=request.user).first()
    if progress and (
        int(progress.points_total or 0) > 0
        or int(progress.streak_count or 0) > 0
        or progress.last_activity_date is not None
    ):
        return Response(
            {"detail": "Only new accounts can redeem referral codes"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    now = timezone.now()
    try:
        r = ReferralRestore.objects.get(code=code)
    except ReferralRestore.DoesNotExist:
        return Response({"detail": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)
    if r.expires_at < now:
        return Response({"detail": "Code expired"}, status=status.HTTP_400_BAD_REQUEST)
    if r.redeemed:
        return Response({"detail": "Code already used"}, status=status.HTTP_400_BAD_REQUEST)
    if r.creator_device == device:
        return Response({"detail": "You cannot use your own code"}, status=status.HTTP_400_BAD_REQUEST)
    r.redeemed = True
    r.redeemer_device = device
    r.save()
    return Response({"ok": True})


@api_view(["GET"])
def referral_status(request):
    """Inviter: check if a friend redeemed so you can claim streak restore."""
    device = _user_device_key(request)
    # Do not require expires_at >= now here: friend may have redeemed in time while the
    # inviter claims later; the row is already redeemed and cannot be reused.
    r = (
        ReferralRestore.objects.filter(
            creator_device=device,
            redeemed=True,
            restore_claimed=False,
        )
        .order_by("-created_at")
        .first()
    )
    return Response({"can_claim": bool(r), "code_suffix": r.code[-4:] if r else None})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def referral_claim(request):
    """Inviter: consume one pending restore after friend redeemed."""
    device = _user_device_key(request)
    r = (
        ReferralRestore.objects.filter(
            creator_device=device,
            redeemed=True,
            restore_claimed=False,
        )
        .order_by("-created_at")
        .first()
    )
    if not r:
        return Response({"detail": "Nothing to claim"}, status=status.HTTP_400_BAD_REQUEST)
    obj, _ = SyndicateUserProgress.objects.get_or_create(
        user=request.user,
        defaults={"state": {}, "streak_count": 0, "last_activity_date": None},
    )
    cur = dict(obj.state or {})
    raw_prev = cur.get("streak_before_break", "1")
    try:
        restore_streak_count = max(1, min(int(str(raw_prev)), 999))
    except (TypeError, ValueError):
        restore_streak_count = 1
    r.restore_claimed = True
    r.save()
    return Response({"ok": True, "restore_streak_count": restore_streak_count})


@api_view(["GET"])
def admin_tasks_active(request):
    """List active admin-created tasks with this device's submission status."""
    device = _user_device_key(request)
    now = timezone.now()
    tasks_all = list(AdminAssignedTask.objects.filter(active=True).order_by("-created_at"))
    tasks: list[AdminAssignedTask] = []
    for t in tasks_all:
        expires_at = t.created_at + timedelta(hours=max(1, int(t.visibility_hours or 1)))
        if expires_at >= now:
            tasks.append(t)
    task_ids = [t.id for t in tasks]
    subs = {
        s.task_id: s
        for s in AdminTaskSubmission.objects.filter(device_id=device, task_id__in=task_ids)
    }
    rows = []
    for t in tasks:
        s = subs.get(t.id)
        vis_hours = max(1, int(t.visibility_hours or 1))
        expires_at = t.created_at + timedelta(hours=vis_hours)
        rows.append(
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "points_target": t.points_target,
                "visibility_hours": vis_hours,
                "admin_note": t.admin_note or "",
                "image_url": t.image_url,
                "active": t.active,
                "created_at": t.created_at.isoformat(),
                "expires_at": expires_at.isoformat(),
                "submission": (
                    {
                        "status": s.status,
                        "awarded_points": s.awarded_points,
                        "points_claimed": s.points_claimed,
                        "submitted_at": s.submitted_at.isoformat(),
                        "elapsed_seconds": int(s.elapsed_seconds or 0),
                        "review_notes": s.review_notes or "",
                        "reviewed_at": s.reviewed_at.isoformat() if s.reviewed_at else None,
                        "has_attachment": bool(s.attachment),
                    }
                    if s
                    else None
                ),
            }
        )
    return Response({"results": rows})


def _admin_task_attachment_is_video(upload) -> bool:
    if upload is None or getattr(upload, "size", 0) == 0:
        return False
    ct = (getattr(upload, "content_type", None) or "").strip().lower()
    if ct.startswith("video/"):
        return True
    name = (getattr(upload, "name", "") or "").lower()
    return name.endswith((".webm", ".mp4", ".mov", ".mkv", ".m4v", ".ogv", ".avi"))


@api_view(["POST"])
def admin_task_submit(request):
    """Create one device submission for an admin-assigned task (multipart with required video)."""
    device = _user_device_key(request)
    try:
        task_id = int(request.data.get("task_id"))
    except (TypeError, ValueError):
        return Response({"detail": "task_id required"}, status=status.HTTP_400_BAD_REQUEST)
    response_text = (request.data.get("response_text") or "").strip()
    if len(response_text) < 3:
        return Response({"detail": "response_text too short"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        task = AdminAssignedTask.objects.get(id=task_id, active=True)
    except AdminAssignedTask.DoesNotExist:
        return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    now = timezone.now()
    vis_hours = max(1, int(task.visibility_hours or 1))
    if task.created_at + timedelta(hours=vis_hours) < now:
        return Response({"detail": "This task is no longer available."}, status=status.HTTP_400_BAD_REQUEST)

    if AdminTaskSubmission.objects.filter(task=task, device_id=device).exists():
        return Response({"detail": "Task already submitted by this device."}, status=status.HTTP_400_BAD_REQUEST)

    upload = request.FILES.get("attachment")
    if upload is not None and getattr(upload, "size", 0) == 0:
        upload = None
    if not _admin_task_attachment_is_video(upload):
        return Response(
            {
                "detail": "A video attachment is required. Record or upload a video file (e.g. MP4 or WebM), max 50MB.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    if upload.size > ADMIN_TASK_MAX_ATTACHMENT_BYTES:
        return Response({"detail": "Attachment too large (max 50MB)."}, status=status.HTTP_400_BAD_REQUEST)

    # Authoritative duration: from when the admin posted the bonus until this submit (server clock).
    elapsed_from_challenge_start = max(0, int((now - task.created_at).total_seconds()))

    started_at = None
    started_at_ms = request.data.get("started_at_ms")
    try:
        if started_at_ms is not None:
            ms = int(started_at_ms)
            if ms > 0:
                candidate = datetime.fromtimestamp(ms / 1000.0, tz=timezone.get_current_timezone())
                # Optional: when the client says the user began the task (can diverge from server time).
                if candidate <= now:
                    started_at = candidate
    except Exception:
        started_at = None

    s = AdminTaskSubmission.objects.create(
        task=task,
        device_id=device,
        response_text=response_text,
        attachment=upload if upload else None,
        started_at=started_at,
        elapsed_seconds=elapsed_from_challenge_start,
        status=AdminTaskSubmission.STATUS_PENDING,
    )
    return Response(
        {
            "ok": True,
            "submission_id": s.id,
            "status": s.status,
            "submitted_at": s.submitted_at.isoformat(),
            "message": "Saved. We will analyze your response and award points later.",
        }
    )


@api_view(["POST"])
def admin_task_claim_points(request):
    """Claim reviewed admin-task points for this device (one-time)."""
    device = _user_device_key(request)
    qs = AdminTaskSubmission.objects.filter(
        device_id=device,
        status=AdminTaskSubmission.STATUS_REVIEWED,
        points_claimed=False,
        awarded_points__gt=0,
    ).order_by("id")
    total = 0
    ids = []
    for s in qs:
        total += int(s.awarded_points or 0)
        ids.append(s.id)
    if ids:
        qs.update(points_claimed=True)
    return Response({"ok": True, "points_awarded": total, "submission_ids": ids})
