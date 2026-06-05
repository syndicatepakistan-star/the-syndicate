from django.conf import settings
from openai import OpenAI

_EASY_ENGLISH_RULES = (
    "Write in simple, easy English. Use short sentences and everyday words. "
    "Avoid jargon, corporate buzzwords, and overly technical language. "
    "Explain ideas like you are talking to a smart friend who is new to business. "
    "Keep the Syndicate tone direct and motivating, but always plain and clear."
)


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
) -> str:
    api_key = (getattr(settings, "OPENAI_API_KEY", None) or "").strip()
    if not api_key:
        return (
            f"THE SOVEREIGN ENTITY AUDIT: DOSSIER {user_id}\n\n"
            "Section A: The Designation\n"
            f"STATUS: {designation}\n"
            f"ARCHETYPE: {archetype}\n"
            "ANALYSIS: You have real potential, but right now your habits are holding you back. "
            "You are working hard, but not in the right direction. You need a clear plan that matches how you think and move.\n\n"
            "Section B: The Virus (Psychological Flaw)\n"
            f"DETECTED VIRUS: {fatal_flaw}\n"
            "THE STING: This pattern is costing you time, money, and momentum every week.\n"
            "THE REALITY: Until you fix this, you will keep repeating the same results.\n"
            "URGENCY OVERRIDE: If you ignore this for the next 30 days, nothing meaningful will change.\n\n"
            "Section C: The Syndicate Execution Stack\n"
            "To fix this, The Syndicate recommends these three courses:\n"
            f"1. THE WEAPON (Primary Business Model):\n• Course: {weapon_course}\n• Why: This business model fits your {archetype} style and is the fastest way for you to start earning.\n"
            f"2. THE SHIELD (Behavioral Correction):\n• Course: {shield_course}\n• Why: This course helps you break the bad habit ({fatal_flaw}) that has been blocking your progress.\n"
            f"3. THE PROTOCOL (Strategic Foundation):\n• Course: {protocol_course}\n• Why: This gives you the basic rules and mindset you need at your current level ({designation}).\n\n"
            "Section D: Final Directive\n"
            "WARNING: Time is running out. The longer you wait, the harder it gets to change.\n"
            "Most people read this and do nothing. Do not be one of them.\n"
            "Your free access window closes in 48 hours. Claim your plan now or stay stuck where you are."
        )

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
        f"Weapon Course: {weapon_course}\n"
        f"Shield Course: {shield_course}\n"
        f"Protocol Course: {protocol_course}\n"
        "IMPORTANT: Use ONLY the three course names above in Section C. "
        "Do not mention any other Syndicate course titles.\n"
        f"Dossier User ID: {user_id}\n"
        f"Answers: {answers}\n\n"
        "Output this exact structure with REAL values filled in.\n"
        "Never output bracket placeholders.\n"
        "Keep each paragraph to 2-4 short sentences.\n\n"
        f"THE SOVEREIGN ENTITY AUDIT: DOSSIER {user_id}\n\n"
        "Section A: The Designation\n"
        f"STATUS: {designation}\n"
        f"ARCHETYPE: {archetype}\n"
        "ANALYSIS: (Write 2-4 simple sentences about their level and what it means in plain English.)\n\n"
        "Section B: The Virus (Psychological Flaw)\n"
        f"DETECTED VIRUS: {fatal_flaw}\n"
        "THE STING: (One simple sentence — what this habit is costing them.)\n"
        "THE REALITY: (One simple sentence — what happens if they do not change.)\n"
        "URGENCY OVERRIDE: (One simple sentence — why they must act in the next 30 days.)\n\n"
        "Section C: The Syndicate Execution Stack\n"
        "To fix this, The Syndicate recommends these three courses:\n"
        f"1. THE WEAPON (Primary Business Model):\n• Course: {weapon_course}\n• Why: (One or two simple sentences — why this business model fits them.)\n"
        f"2. THE SHIELD (Behavioral Correction):\n• Course: {shield_course}\n• Why: (One or two simple sentences — how this fixes the virus {fatal_flaw}.)\n"
        f"3. THE PROTOCOL (Strategic Foundation):\n• Course: {protocol_course}\n• Why: (One or two simple sentences — why this foundation fits their designation.)\n\n"
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
    return _sanitize_placeholders(
        response.output_text.strip(),
        designation=designation,
        archetype=archetype,
        fatal_flaw=fatal_flaw,
        weapon_course=weapon_course,
        shield_course=shield_course,
        protocol_course=protocol_course,
        user_id=user_id,
    )
