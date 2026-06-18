import re

from django.conf import settings
from openai import OpenAI

from .logic import build_section_c_report

_EASY_ENGLISH_RULES = (
    "Write in simple, easy English. Use short sentences and everyday words. "
    "Avoid jargon, corporate buzzwords, and overly technical language. "
    "Explain ideas like you are talking to a smart friend who is new to business. "
    "Keep the Syndicate tone direct, intense, and motivating — plain words, hard truth."
)

_SECTION_C_PATTERN = re.compile(r"Section C:.*?(?=Section D:|$)", re.DOTALL | re.IGNORECASE)
_SECTION_E_PATTERN = re.compile(r"Section E:.*?(?=Section D:|$)", re.DOTALL | re.IGNORECASE)


def _sanitize_placeholders(
    report: str,
    designation: str,
    archetype: str,
    fatal_flaw: str,
    weapon_course: str,
    shield_course: str,
    protocol_course: str,
    user_id: str,
) -> str:
    replacements = {
        "[DESIGNATION BASED ON SCORE]": designation,
        "[ARCHETYPE]": archetype,
        "[FLAW NAME]": fatal_flaw,
        "[SKILL COURSE]": weapon_course,
        "[PSYCHOLOGY COURSE]": shield_course,
        "[SECONDARY PSYCHOLOGY COURSE]": protocol_course,
        "[USER_ID]": user_id,
    }
    for old, new in replacements.items():
        report = report.replace(old, new)
    return report


def _virus_sting_copy(fatal_flaw: str) -> str:
    return (
        f"The {fatal_flaw} virus is not a quirk — it is a weekly tax on your time, money, and momentum. "
        "Every time you feed this pattern, disciplined operators take ground you will not get back."
    )


def _virus_reality_copy(fatal_flaw: str) -> str:
    return (
        f"Until you break {fatal_flaw}, you will keep hitting the same ceiling — stalled income, broken promises to yourself, "
        "and progress that resets the moment pressure shows up."
    )


def _virus_urgency_copy() -> str:
    return (
        "You have a narrow window to install a new standard. Wait 30 days and this report becomes another bookmark — "
        "same habits, same losses, same story."
    )


def compose_full_report(ai_report: str, archetype: str) -> str:
    """Strip Section E and inject deterministic Section C before Section D."""
    report = _SECTION_E_PATTERN.sub("", ai_report)
    section_c = build_section_c_report(archetype).strip() + "\n\n"
    if _SECTION_C_PATTERN.search(report):
        report = _SECTION_C_PATTERN.sub(section_c, report)
    elif "Section D:" in report:
        report = report.replace("Section D:", section_c + "Section D:", 1)
    else:
        report = report.rstrip() + "\n\n" + section_c
    return report.strip() + "\n"


def generate_ai_report(
    score: int,
    designation: str,
    archetype: str,
    fatal_flaw: str,
    weapon_course: str,
    shield_course: str,
    protocol_course: str,
    user_id: str,
    answers: list[dict],
    archetype_catalog: dict | None = None,
) -> str:
    del archetype_catalog  # Section E removed — catalog is not appended to reports.

    api_key = (getattr(settings, "OPENAI_API_KEY", None) or "").strip()
    if not api_key:
        base = (
            f"THE SOVEREIGN ENTITY AUDIT: DOSSIER {user_id}\n\n"
            "Section A: The Designation\n"
            f"STATUS: {designation}\n"
            f"ARCHETYPE: {archetype}\n"
            "ANALYSIS: You have real potential, but your current habits are misaligned with how you think and move. "
            "You are working hard without a stack that matches your archetype. You need a clear plan built for operators at your level.\n\n"
            "Section B: The Virus (Psychological Flaw)\n"
            f"DETECTED VIRUS: {fatal_flaw}\n"
            f"THE STING: {_virus_sting_copy(fatal_flaw)}\n"
            f"THE REALITY: {_virus_reality_copy(fatal_flaw)}\n"
            f"URGENCY OVERRIDE: {_virus_urgency_copy()}\n\n"
            "Section D: Final Directive\n"
            "WARNING: Time is running out — every week you delay, the gap between you and disciplined operators widens.\n"
            "Most people read this and do nothing. Do not be one of them.\n"
            "Your free access window closes in 48 hours. Claim your plan now or stay stuck where you are."
        )
        return compose_full_report(base, archetype)

    client = OpenAI(api_key=api_key)
    prompt = (
        "You are writing a quiz result report for THE SYNDICATE funnel.\n"
        f"{_EASY_ENGLISH_RULES}\n"
        "Do NOT use words like: operational fragility, leverage, liquid capital, "
        "system liability, architecture, paradigm, or similar corporate/technical terms.\n"
        "Use simple words like: money, plan, habit, problem, fix, course, progress, stuck, win.\n\n"
        f"Score: {score}\n"
        f"Designation: {designation}\n"
        f"Archetype: {archetype}\n"
        f"Detected Virus: {fatal_flaw}\n"
        f"Dossier User ID: {user_id}\n"
        f"Answers: {answers}\n\n"
        "Output this exact structure with REAL values filled in.\n"
        "Never output bracket placeholders.\n"
        "Do NOT write Section C — it is added automatically after generation.\n"
        "Do NOT write Section E.\n"
        "Keep Section A to 2-4 short sentences.\n\n"
        f"THE SOVEREIGN ENTITY AUDIT: DOSSIER {user_id}\n\n"
        "Section A: The Designation\n"
        f"STATUS: {designation}\n"
        f"ARCHETYPE: {archetype}\n"
        "ANALYSIS: (Write 2-4 simple sentences about their level and what it means in plain English.)\n\n"
        "Section B: The Virus (Psychological Flaw)\n"
        f"DETECTED VIRUS: {fatal_flaw}\n"
        "THE STING: (Write 2-3 powerful sentences — name what this virus costs them in time, money, and momentum. Direct Syndicate tone.)\n"
        "THE REALITY: (Write 2-3 powerful sentences — what keeps repeating if they refuse to change. No soft language.)\n"
        "URGENCY OVERRIDE: (One strong sentence — why they must act within the next 30 days.)\n\n"
        "Section D: Final Directive\n"
        "WARNING: (One simple sentence about urgency.)\n"
        "(One simple sentence — most people do nothing; they should not.)\n"
        "Your free access window closes in 48 hours. Claim your plan now or stay stuck where you are."
    )

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        temperature=0.7,
    )
    sanitized = _sanitize_placeholders(
        response.output_text.strip(),
        designation=designation,
        archetype=archetype,
        fatal_flaw=fatal_flaw,
        weapon_course=weapon_course,
        shield_course=shield_course,
        protocol_course=protocol_course,
        user_id=user_id,
    )
    return compose_full_report(sanitized, archetype)
