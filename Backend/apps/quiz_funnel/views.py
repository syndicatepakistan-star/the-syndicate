import json
import re

from django.http import HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .quiz_data import QUIZ_QUESTIONS
from .ai_service import generate_ai_report
from .logic import build_recommendation, get_designation_short
from .models import QuizOption, QuizQuestion, Result, User

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
    )

    user = User.objects.create(name=name, email=email, phone=phone)
    Result.objects.create(
        user=user,
        score=score,
        category=designation,
        virus=fatal_flaw,
        course_offer=weapon_course,
        ai_report=ai_report,
    )

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
        }
    )
