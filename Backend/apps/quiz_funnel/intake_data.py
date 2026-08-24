"""Syn Diagnosis follow-up intake — question copy (served to the public intake page)."""

from __future__ import annotations

INTAKE_QUESTIONS: tuple[dict[str, str], ...] = (
    {
        "id": "location",
        "label": "Where are you based?",
        "placeholder": "City and country (optional)",
    },
    {
        "id": "employment",
        "label": "What is your current situation?",
        "placeholder": "Employed, self-employed, student, between jobs, etc.",
    },
    {
        "id": "business_history",
        "label": "Have you tried any business before?",
        "placeholder": "If yes — which one(s)? If not, say none yet.",
    },
    {
        "id": "goals",
        "label": "What are you trying to build or achieve in the next 12 months?",
        "placeholder": "Your main goal or direction right now.",
    },
    {
        "id": "blocker",
        "label": "What is the biggest thing blocking you right now?",
        "placeholder": "Time, capital, skills, clarity, consistency — whatever applies.",
    },
)

INTAKE_QUESTION_IDS = frozenset(q["id"] for q in INTAKE_QUESTIONS)
