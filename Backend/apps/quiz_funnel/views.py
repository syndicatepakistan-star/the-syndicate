import json
import re

from django.http import HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .quiz_data import QUIZ_QUESTIONS
from .ai_service import generate_ai_report
from .logic import build_recommendation, get_designation_short
from .intake_data import INTAKE_QUESTIONS, INTAKE_QUESTION_IDS
from .intake_tokens import ensure_intake_ref, intake_url_for_user
from .models import IntakeResponse, QuizOption, QuizQuestion, Result, User

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_REGEX = re.compile(r"^[0-9+\-\s()]{7,20}$")


def seed_quiz_questions():
    # Avoid write locks on every request; only seed when table is empty.
    if QuizQuestion.objects.exists():
        return

    for item in QUIZ_QUESTIONS:
        section_label = ""
        if item["question"].startswith("[") and "]" in item["question"]:
            section_label = item["question"][1 : item["question"].index("]")]

        question = QuizQuestion.objects.create(
            id=item["id"],
            question_text=item["question"],
            section=section_label,
        )

        for index, option in enumerate(item["options"]):
            QuizOption.objects.create(
                question=question,
                option_letter=option[:1],
                option_text=option,
                position=index,
            )


def _first_name(full_name: str) -> str:
    parts = (full_name or "").strip().split(None, 1)
    return parts[0] if parts else ""


def _find_or_create_quiz_user(*, name: str, email: str, phone: str) -> User:
    email_norm = email.strip().lower()
    user = User.objects.filter(email__iexact=email_norm).order_by("-id").first()
    if user is None:
        user = User.objects.create(name=name, email=email_norm, phone=phone)
    else:
        changed = False
        if name and (user.name or "").strip() != name:
            user.name = name
            changed = True
        if phone and (user.phone or "").strip() != phone:
            user.phone = phone
            changed = True
        if changed:
            user.save(update_fields=["name", "phone"])
    return user


def _user_by_intake_ref(ref: str) -> User | None:
    token = (ref or "").strip()
    if not token or token.lower() in {"none", "null", "undefined"}:
        return None
    return User.objects.filter(intake_ref=token).first()


def _user_by_intake_email(email: str) -> User | None:
    email_norm = (email or "").strip().lower()
    if not email_norm or not EMAIL_REGEX.match(email_norm):
        return None
    return User.objects.filter(email__iexact=email_norm).order_by("-id").first()


def _resolve_intake_user(*, ref: str = "", email: str = "") -> User | None:
    """Prefer opaque ref; fall back to quiz email (Klaviyo {{ person.email }} links)."""
    user = _user_by_intake_ref(ref)
    if user is not None:
        return user
    return _user_by_intake_email(email)


def _intake_questions_payload():
    return [
        {"id": q["id"], "label": q["label"], "placeholder": q["placeholder"]}
        for q in INTAKE_QUESTIONS
    ]


def _normalize_intake_answers(raw) -> dict[str, str]:
    if not isinstance(raw, list):
        raise ValueError("answers must be a list")
    out: dict[str, str] = {}
    for row in raw:
        if not isinstance(row, dict):
            continue
        qid = str(row.get("question_id") or row.get("id") or "").strip()
        if qid not in INTAKE_QUESTION_IDS:
            continue
        answer = str(row.get("answer") or "").strip()
        if len(answer) < 2:
            raise ValueError(f"Answer for '{qid}' is too short.")
        if len(answer) > 4000:
            raise ValueError(f"Answer for '{qid}' is too long.")
        out[qid] = answer
    if len(out) != len(INTAKE_QUESTION_IDS):
        missing = INTAKE_QUESTION_IDS - set(out.keys())
        raise ValueError(f"Missing answers for: {', '.join(sorted(missing))}")
    return out


@require_GET
def fetch_quiz_questions(request):
    seed_quiz_questions()
    rows = QuizQuestion.objects.order_by("id").prefetch_related("options")
    payload = []
    for row in rows:
        options = [opt.option_text for opt in sorted(row.options.all(), key=lambda o: o.position)]
        payload.append(
            {
                "id": row.id,
                "question": row.question_text,
                "options": options,
            }
        )
    return JsonResponse(payload, safe=False)


@require_GET
def fetch_intake_session(request):
    ref = (request.GET.get("ref") or "").strip()
    email = (request.GET.get("email") or "").strip()
    user = _resolve_intake_user(ref=ref, email=email)
    if user is None:
        return JsonResponse(
            {
                "valid": False,
                "error": "Invalid or expired link. Use the link from your Syn Diagnosis email.",
            },
            status=404,
        )

    # Ensure ref exists so admin + optional ref links keep working.
    ensure_intake_ref(user)

    already = hasattr(user, "intake") and user.intake is not None
    return JsonResponse(
        {
            "valid": True,
            "already_submitted": already,
            "first_name": _first_name(user.name or ""),
            "questions": _intake_questions_payload(),
            "intake_ref": user.intake_ref or "",
            "email": (user.email or "").strip().lower(),
        }
    )


@csrf_exempt
@require_POST
def submit_intake(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON payload")

    ref = str(payload.get("ref") or "").strip()
    email = str(payload.get("email") or "").strip()
    user = _resolve_intake_user(ref=ref, email=email)
    if user is None:
        return JsonResponse({"ok": False, "error": "Invalid or expired link."}, status=404)

    ensure_intake_ref(user)

    if hasattr(user, "intake") and user.intake is not None:
        return JsonResponse(
            {
                "ok": True,
                "already_submitted": True,
                "message": "We already have your answers. Thank you.",
            }
        )

    try:
        answers = _normalize_intake_answers(payload.get("answers"))
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    IntakeResponse.objects.create(user=user, answers=answers)

    try:
        from .klaviyo import subscribe_syn_diagnosis_email

        result = getattr(user, "result", None)
        props = {
            "intake_ref": user.intake_ref,
            "intake_url": intake_url_for_user(user),
            "intake_completed": True,
        }
        if result:
            props.update(
                {
                    "syn_diagnosis_score": result.score,
                    "syn_diagnosis_category": result.category or "",
                    "syn_diagnosis_virus": result.virus or "",
                }
            )
        subscribe_syn_diagnosis_email(
            email=user.email or "",
            name=user.name or "",
            phone=user.phone or "",
            properties=props,
        )
    except Exception:
        pass

    return JsonResponse({"ok": True, "already_submitted": False, "message": "Thank you — your answers were saved."})


@csrf_exempt
@require_POST
def save_quiz_lead(request):
    """
    Mid-quiz lead capture: create/update the quiz user as soon as name+email
    (and later phone) are collected. Does not generate the final report.
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON payload")

    user_meta = payload.get("user") or payload
    name = (user_meta.get("name") or "").strip()
    email = (user_meta.get("email") or "").strip()
    phone = (user_meta.get("phone") or "").strip()

    if len(name) < 2:
        return HttpResponseBadRequest("Name is required.")
    if not EMAIL_REGEX.match(email):
        return HttpResponseBadRequest("Valid email is required.")
    if phone and not PHONE_REGEX.match(phone):
        return HttpResponseBadRequest("Valid phone number is required.")

    user = _find_or_create_quiz_user(name=name, email=email, phone=phone or "")
    intake_ref = ensure_intake_ref(user)
    intake_url = intake_url_for_user(user)

    # Start email sequencing as soon as we have the lead (safe no-op if unset).
    try:
        from .klaviyo import subscribe_syn_diagnosis_email

        subscribe_syn_diagnosis_email(
            email=email,
            name=name,
            phone=phone or "",
            properties={
                "intake_ref": intake_ref,
                "intake_url": intake_url,
                "quiz_lead_partial": True,
                "quiz_lead_has_phone": bool(phone),
                "intake_completed": hasattr(user, "intake") and user.intake is not None,
            },
        )
    except Exception:
        pass

    return JsonResponse(
        {
            "ok": True,
            "intake_ref": intake_ref,
            "intake_url": intake_url,
            "email": (user.email or "").strip().lower(),
            "name": user.name or "",
            "phone": user.phone or "",
        }
    )


@csrf_exempt
@require_POST
def submit_answers(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON payload")

    user_meta = payload.get("user") or {}
    answers = payload.get("answers") or []
    name = (user_meta.get("name") or "").strip()
    email = (user_meta.get("email") or "").strip()
    phone = (user_meta.get("phone") or "").strip()

    if len(name) < 2:
        return HttpResponseBadRequest("Name is required.")
    if not EMAIL_REGEX.match(email):
        return HttpResponseBadRequest("Valid email is required.")
    if not PHONE_REGEX.match(phone):
        return HttpResponseBadRequest("Valid phone number is required.")
    if not isinstance(answers, list) or not answers:
        return HttpResponseBadRequest("Answers are required.")

    normalized_answers = []
    for answer in answers:
        question_id = int(answer.get("question_id"))
        selected_option = (answer.get("selected_option") or "").strip().upper()
        if selected_option not in {"A", "B", "C", "D"}:
            return HttpResponseBadRequest("Invalid answer option.")
        normalized_answers.append({"question_id": question_id, "selected_option": selected_option})

    recommendation = build_recommendation(normalized_answers)
    score = recommendation["score"]
    designation = recommendation["category"]
    archetype = recommendation["archetype"]
    fatal_flaw = recommendation["detected_virus"]
    weapon_course = recommendation["execution_stack"]["weapon"]
    shield_course = recommendation["execution_stack"]["shield"]
    protocol_course = recommendation["execution_stack"]["protocol"]
    user_id = (email.split("@")[0] if email else name).upper().replace(" ", "_")

    ai_report = generate_ai_report(
        score=score,
        designation=designation,
        archetype=archetype,
        fatal_flaw=fatal_flaw,
        weapon_course=weapon_course,
        shield_course=shield_course,
        protocol_course=protocol_course,
        user_id=user_id,
        answers=normalized_answers,
        archetype_catalog=recommendation.get("archetype_catalog"),
    )

    user = _find_or_create_quiz_user(name=name, email=email, phone=phone)
    intake_ref = ensure_intake_ref(user)
    intake_url = intake_url_for_user(user)

    Result.objects.update_or_create(
        user=user,
        defaults={
            "score": score,
            "category": designation,
            "virus": fatal_flaw,
            "course_offer": weapon_course,
            "ai_report": ai_report,
        },
    )

    # Syn Diagnosis → Klaviyo list (email sequencing). Failures never block the quiz.
    try:
        from .klaviyo import subscribe_syn_diagnosis_email

        subscribe_syn_diagnosis_email(
            email=email,
            name=name,
            phone=phone,
            properties={
                "syn_diagnosis_score": score,
                "syn_diagnosis_category": designation,
                "syn_diagnosis_virus": fatal_flaw,
                "syn_diagnosis_course_offer": weapon_course,
                "intake_ref": intake_ref,
                "intake_url": intake_url,
                "intake_completed": hasattr(user, "intake") and user.intake is not None,
            },
        )
    except Exception:
        pass

    return JsonResponse(
        {
            "score": score,
            "category": designation,
            "designation": recommendation["designation"],
            "designation_short": get_designation_short(designation),
            "archetype": archetype,
            "detected_virus": fatal_flaw,
            "diagnosis": recommendation["diagnosis"],
            "execution_stack": recommendation["execution_stack"],
            "recommended_track": weapon_course,
            "weapon_course": weapon_course,
            "shield_course": shield_course,
            "protocol_course": protocol_course,
            "fatal_flaw": fatal_flaw,
            "ai_report": ai_report,
            "archetype_catalog": recommendation.get("archetype_catalog"),
            "intake_ref": intake_ref,
            "intake_url": intake_url,
        }
    )
