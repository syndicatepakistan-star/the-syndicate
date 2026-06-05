from django.conf import settings
from openai import OpenAI


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
            "ANALYSIS: You have the raw materials to exit, but your current configuration is a System Liability. "
            "You are trying to fight a 2026 war with obsolete programming. You have the engine, but the system is currently using your energy to power its own machine.\n\n"
            "Section B: The Virus (Psychological Flaw)\n"
            f"DETECTED VIRUS: {fatal_flaw}\n"
            "THE STING: Your current behavior pattern is draining your leverage before you can build momentum.\n"
            "THE REALITY: Your data reveals a repeatable bottleneck that keeps your output disconnected from long-term capital growth.\n"
            "URGENCY OVERRIDE: If this remains unchecked, the next 30 days will harden the same cycle and delay your exit timeline.\n\n"
            "Section C: The Syndicate Execution Stack\n"
            "To neutralize your liability status, The Syndicate prescribes the following Integrated Stack:\n"
            f"1. THE WEAPON (Primary Business Model):\n• Course: {weapon_course}\n• Why: This aligns with your {archetype} DNA. It is the fastest way to generate liquid capital based on your natural strengths.\n"
            f"2. THE SHIELD (Behavioral Correction):\n• Course: {shield_course}\n• Why: This directly destroys the virus that has been sabotaging your past plays.\n"
            f"3. THE PROTOCOL (Strategic Foundation):\n• Course: {protocol_course}\n• Why: This provides the Rules of the Game necessary for your current designation.\n\n"
            "Section D: Final Directive\n"
            'WARNING: The window to exit the system is closing. Economic shifts are making it harder for the "unmapped" to survive.\n'
            "Most people will read this audit and do nothing. They will return to the struggle and remain a statistic.\n"
            "Your Admission Grant expires in 48 Hours. Claim your Blueprint or return to the struggle."
        )

    client = OpenAI(api_key=api_key)
    prompt = (
        "You are writing a report for THE SYNDICATE funnel.\n"
        "Keep the tone raw, direct, strategic, and data-driven.\n"
        f"Score: {score}\n"
        f"Designation: {designation}\n"
        f"Archetype: {archetype}\n"
        f"Detected Virus: {fatal_flaw}\n"
        f"Weapon Course: {weapon_course}\n"
        f"Shield Course: {shield_course}\n"
        f"Protocol Course: {protocol_course}\n"
        f"Dossier User ID: {user_id}\n"
        f"Answers: {answers}\n\n"
        "Output this structure with REAL values filled in.\n"
        "Never output bracket placeholders.\n"
        f"THE SOVEREIGN ENTITY AUDIT: DOSSIER {user_id}\n\n"
        "Section A: The Designation\n"
        f"STATUS: {designation}\n"
        f"ARCHETYPE: {archetype}\n"
        "ANALYSIS: You have the raw materials to exit, but your current configuration is a System Liability. You are trying to fight a 2026 war with obsolete programming. You have the engine, but the system is currently using your energy to power its own machine.\n\n"
        "Section B: The Virus (Psychological Flaw)\n"
        f"DETECTED VIRUS: {fatal_flaw}\n"
        "THE STING: ...\n"
        "THE REALITY: ...\n"
        "URGENCY OVERRIDE: ...\n\n"
        "Section C: The Syndicate Execution Stack\n"
        "To neutralize your liability status, The Syndicate prescribes the following Integrated Stack:\n"
        f"1. THE WEAPON (Primary Business Model):\n• Course: {weapon_course}\n• Why: This aligns with your {archetype} DNA. It is the fastest way to generate liquid capital based on your natural strengths.\n"
        f"2. THE SHIELD (Behavioral Correction):\n• Course: {shield_course}\n• Why: This directly destroys the virus that has been sabotaging your past plays.\n"
        f"3. THE PROTOCOL (Strategic Foundation):\n• Course: {protocol_course}\n• Why: This provides the Rules of the Game necessary for your current designation.\n\n"
        "Section D: Final Directive\n"
        'WARNING: The window to exit the system is closing. Economic shifts are making it harder for the "unmapped" to survive.\n'
        "Most people will read this audit and do nothing. They will return to the struggle and remain a statistic.\n"
        "Your Admission Grant expires in 48 Hours. Claim your Blueprint or return to the struggle."
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
