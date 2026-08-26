"""Syn Diagnosis follow-up intake — question copy (served to the public intake page)."""

from __future__ import annotations

INTAKE_QUESTIONS: tuple[dict[str, str], ...] = (
    {
        "id": "location",
        "label": "What Businesses have you tried before? And When was this?",
        "placeholder": "Ecommerce, content creation, crypto trading, etc.",
    },
    {
        "id": "employment",
        "label": "Did you fail or succeed in these businesses? And Why?",
        "placeholder": "Failed because of lack of time, capital, skills, clarity, consistency, etc.",
    },
    {
        "id": "business_history",
        "label": "What is the biggest thing you're struggling with right now?",
        "placeholder": "The Right business model to start, The Right market to target, The Right product to sell, etc.",
    },
    {
        "id": "goals",
        "label": "What are you trying to build or achieve in the next 12 months?",
        "placeholder": "Your main goal or direction right now.",
    },
    {
        "id": "blocker",
        "label": "What is the biggest thing that you would like to achieve from this audit?",
        "placeholder": "Action plan, direction, confidence, motivation, expert opinion,etc.",
    },
)

INTAKE_QUESTION_IDS = frozenset(q["id"] for q in INTAKE_QUESTIONS)
