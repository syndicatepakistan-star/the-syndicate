"""
Deterministic Syndicate recommendation engine — Triple-Threat Execution Stack.

Strict mapping only. Banned course: The Art Of Business Persuasion.
"""

from __future__ import annotations

from typing import Any

from .quiz_data import QUIZ_QUESTIONS

SCORE_MAP = {"A": 1, "B": 3, "C": 5, "D": 10}
OPTION_INDEX_MAP = {"A": 0, "B": 1, "C": 2, "D": 3}

BANNED_COURSES = frozenset({"The Art Of Business Persuasion", "The Art of Business Persuasion"})

# --- B. Virus → Shield (ONLY these shields) ---
SHIELD_BY_VIRUS: dict[str, str] = {
    "Quitter": "Mastering Consistency",
    "Employee": "The 9 to 5 Exit Strategy",
    "Chaos Agent": "Syndicate 13 Business Rules",
    "Victim": "Syndicate Money Philosophy",
    "Spender": "The Compound Effect",
    "Emotional Mover": "Mastering Risk and Uncertainty",
    "Loner": "Business Warfare",
    "Order Taker": "Micro Business Protocol",
    "Identity Crisis": "The Secret To Transformation",
    "Slow Burner": "Hustle Hard",
    "Amateur": "Zero to One Million",
    "Visionary": "Syndicate 13 Business Rules",
}

VIRUS_DIAGNOSIS: dict[str, str] = {
    "Quitter": "You lose momentum when the hype fades — consistency is your leak.",
    "Employee": "You still think like a worker, not an owner building an exit.",
    "Chaos Agent": "You hustle without a unified map — energy with no architecture.",
    "Victim": "Past pain and outside doubt still dictate your ceiling.",
    "Spender": "Status spending is draining your war chest before capital compounds.",
    "Emotional Mover": "Fear of rejection and uncertainty blocks decisive moves.",
    "Loner": "Isolation and mistrust cap your scale — you cannot win alone.",
    "Order Taker": "You avoid selling yourself — revenue dies in silence.",
    "Identity Crisis": "Imposter syndrome makes you play small when capital is available.",
    "Slow Burner": "Low urgency keeps you in survival mode instead of offense.",
    "Amateur": "Technical gaps and unfinished plays block your scale path.",
    "Visionary": "Big vision without structure — you need rules before empire.",
}

# Question + option → virus (strict triggers from spec).
VIRUS_BY_QUESTION_OPTION: dict[tuple[int, str], str] = {
    (4, "A"): "Employee",
    (4, "B"): "Employee",
    (8, "A"): "Quitter",
    (8, "B"): "Spender",
    (8, "C"): "Emotional Mover",
    (8, "D"): "Loner",
    (9, "A"): "Quitter",
    (9, "B"): "Emotional Mover",
    (9, "C"): "Amateur",
    (9, "D"): "Visionary",
    (10, "A"): "Loner",
    (10, "B"): "Spender",
    (10, "C"): "Amateur",
    (10, "D"): "Visionary",
    (11, "A"): "Victim",
    (11, "B"): "Spender",
    (11, "C"): "Loner",
    (11, "D"): "Chaos Agent",
    (16, "A"): "Order Taker",
    (16, "B"): "Identity Crisis",
    (16, "C"): "Slow Burner",
}

# Tie-break after Q8 (lower index = lower priority when picking non-Q8 winner).
VIRUS_PRIORITY: tuple[str, ...] = (
    "Visionary",
    "Amateur",
    "Slow Burner",
    "Identity Crisis",
    "Order Taker",
    "Loner",
    "Emotional Mover",
    "Spender",
    "Victim",
    "Chaos Agent",
    "Employee",
    "Quitter",
)

# --- A. Archetype → Weapon models (DB playlist titles) ---
ARCHETYPE_WEAPON_MODELS: dict[str, dict[str, list[str]]] = {
    "Ghost Architect": {
        "entry": [
            "Python Programming",
            "Building Apps using React JS",
            "App Building (using Flutter)",
            "How To Build A.I Agents",
        ],
        "elite": [
            "AI Automations",
            "Crypto Trading with Technical Analysis Course",
            "Faceless YouTube AI Content Creator Course",
            "Building Games Using Unreal Engine",
        ],
    },
    "Digital Raider": {
        "entry": [
            "Crypto Trading with Technical Analysis Course",
            "How To Build A.I Agents",
        ],
        "elite": [
            "Building Games Using Unreal Engine",
            "WordPress Blog",
            "Framer Crash Course",
        ],
    },
    "Creative Infiltrator": {
        "entry": [
            "Graphics Design Using Canva",
            "Faceless YouTube AI Content Creator Course",
        ],
        "elite": [
            "Print On Demand Clothing",
            "Book Publishing On Amazon (KINDLE)",
        ],
    },
    "Asset Grinder": {
        "entry": [
            "Book Publishing On Amazon (KINDLE)",
            "Print On Demand Clothing",
        ],
        "elite": [
            "Faceless YouTube AI Content Creator Course",
            "How To Build A.I Agents",
        ],
    },
}

ARCHETYPE_BY_Q5: dict[str, str] = {
    "A": "Digital Raider",
    "B": "Creative Infiltrator",
    "C": "Asset Grinder",
    "D": "Ghost Architect",
}

ARCHETYPE_BY_Q6: dict[str, str] = {
    "A": "Digital Raider",
    "B": "Creative Infiltrator",
    "C": "Ghost Architect",
    "D": "Asset Grinder",
}

ARCHETYPE_BY_Q7: dict[str, str] = {
    "A": "Digital Raider",
    "B": "Ghost Architect",
    "C": "Creative Infiltrator",
    "D": "Asset Grinder",
}

ARCHETYPE_TIEBREAK_ORDER: tuple[str, ...] = (
    "Ghost Architect",
    "Digital Raider",
    "Creative Infiltrator",
    "Asset Grinder",
)

# --- C. Protocol by power level (score) ---
PROTOCOL_BY_DESIGNATION: dict[str, str] = {
    "Street Soldier": "The Secret To Transformation",
    "Rogue Operator": "The 9 to 5 Exit Strategy",
    "Syndicate Specialist": "The Art of Critical Thinking",
    "Prospect": "The Business of Empire Building",
}

DESIGNATION_BY_SCORE: tuple[tuple[int, int, str], ...] = (
    (17, 50, "Street Soldier"),
    (51, 100, "Rogue Operator"),
    (101, 140, "Syndicate Specialist"),
    (141, 170, "Prospect"),
)

# Legacy DB category labels (accounts / Result model).
LEGACY_DESIGNATION_BY_LABEL: dict[str, str] = {
    "Street Soldier": "THE STREET SOLDIER",
    "Rogue Operator": "THE ROGUE OPERATOR",
    "Syndicate Specialist": "THE SYNDICATE SPECIALIST",
    "Prospect": "THE PROSPECT (EMPIRE TIER)",
}


def compute_score(answers: list[dict]) -> int:
    return sum(SCORE_MAP[item["selected_option"]] for item in answers)


def _answer_letter(answers: list[dict], question_id: int) -> str | None:
    for item in answers:
        if item.get("question_id") == question_id:
            letter = (item.get("selected_option") or "").strip().upper()
            if letter in SCORE_MAP:
                return letter
    return None


def get_designation(score: int) -> str:
    for low, high, label in DESIGNATION_BY_SCORE:
        if low <= score <= high:
            return label
    if score < 17:
        return "Street Soldier"
    return "Prospect"


def get_category(score: int) -> str:
    """Legacy designation string stored on Result.category."""
    return LEGACY_DESIGNATION_BY_LABEL.get(get_designation(score), "THE STREET SOLDIER")


def get_designation_short(designation: str) -> str:
    legacy = designation.upper()
    if "SOLDIER" in legacy:
        return "SOLDIER"
    if "OPERATOR" in legacy:
        return "OPERATOR"
    if "SPECIALIST" in legacy:
        return "SPECIALIST"
    if "PROSPECT" in legacy:
        return "PROSPECT"
    return designation.split()[0].upper() if designation else ""


def detect_archetype(answers: list[dict]) -> str:
    counts: dict[str, int] = {name: 0 for name in ARCHETYPE_TIEBREAK_ORDER}
    for question_id, mapping in ((5, ARCHETYPE_BY_Q5), (6, ARCHETYPE_BY_Q6), (7, ARCHETYPE_BY_Q7)):
        letter = _answer_letter(answers, question_id)
        if not letter:
            continue
        archetype = mapping.get(letter)
        if archetype:
            counts[archetype] = counts.get(archetype, 0) + 1

    best = max(counts.values()) if counts else 0
    if best == 0:
        return "Asset Grinder"

    for archetype in ARCHETYPE_TIEBREAK_ORDER:
        if counts.get(archetype, 0) == best:
            return archetype
    return "Asset Grinder"


def _collect_triggered_viruses(answers: list[dict]) -> dict[tuple[int, str], str]:
    triggered: dict[tuple[int, str], str] = {}
    for item in answers:
        qid = item.get("question_id")
        letter = (item.get("selected_option") or "").strip().upper()
        if qid is None or letter not in SCORE_MAP:
            continue
        virus = VIRUS_BY_QUESTION_OPTION.get((int(qid), letter))
        if virus:
            triggered[(int(qid), letter)] = virus
    return triggered


def detect_fatal_flaw(answers: list[dict]) -> str:
    """Detected virus label (internal API name). Q8 answer takes precedence."""
    return detect_virus(answers)


def detect_virus(answers: list[dict]) -> str:
    triggered = _collect_triggered_viruses(answers)

    for letter in ("A", "B", "C", "D"):
        key = (8, letter)
        if key in triggered:
            return triggered[key]

    viruses = set(triggered.values())
    for virus in VIRUS_PRIORITY:
        if virus in viruses:
            return virus
    return "Amateur"


def get_recommended_shield(virus: str) -> str:
    shield = SHIELD_BY_VIRUS.get(virus, "Syndicate 13 Business Rules")
    return _assert_allowed_course(shield)


def get_recommended_protocol(designation: str) -> str:
    label = designation
    for legacy, modern in LEGACY_DESIGNATION_BY_LABEL.items():
        if designation == modern:
            label = legacy
            break
    if label not in PROTOCOL_BY_DESIGNATION:
        for key in PROTOCOL_BY_DESIGNATION:
            if key.lower() in (label or "").lower():
                label = key
                break
    shield = PROTOCOL_BY_DESIGNATION.get(label, "The Secret To Transformation")
    return _assert_allowed_course(shield)


def _budget_tier(answers: list[dict]) -> str:
    letter = _answer_letter(answers, 14)
    if letter in {"A", "B"}:
        return "entry"
    if letter in {"C", "D"}:
        return "elite"
    return "entry"


def _weapon_pick_index(answers: list[dict], pool_size: int) -> int:
    if pool_size < 1:
        return 0
    letter = _answer_letter(answers, 5) or "A"
    return (ord(letter) - ord("A")) % pool_size


def get_weapon_course(archetype: str, score: int, answers: list[dict] | None = None) -> str:
    answers = answers or []
    models = ARCHETYPE_WEAPON_MODELS.get(archetype) or ARCHETYPE_WEAPON_MODELS["Asset Grinder"]
    tier = _budget_tier(answers)
    pool = models.get(tier) or models["entry"]
    if not pool:
        pool = models["entry"]
    idx = _weapon_pick_index(answers, len(pool))
    return _assert_allowed_course(pool[idx])


def _assert_allowed_course(course: str) -> str:
    if course in BANNED_COURSES:
        raise ValueError(f"Banned course recommendation blocked: {course}")
    return course


def build_recommendation(answers: list[dict]) -> dict[str, Any]:
    """
    Deterministic Triple-Threat Execution Stack JSON.
    """
    score = compute_score(answers)
    designation = get_designation(score)
    archetype = detect_archetype(answers)
    virus = detect_virus(answers)
    weapon = get_weapon_course(archetype, score, answers)
    shield = get_recommended_shield(virus)
    protocol = get_recommended_protocol(designation)
    diagnosis = VIRUS_DIAGNOSIS.get(virus, "Your profile shows a repeatable bottleneck blocking capital growth.")

    return {
        "score": score,
        "designation": designation,
        "archetype": archetype,
        "detected_virus": virus,
        "diagnosis": diagnosis,
        "execution_stack": {
            "weapon": weapon,
            "shield": shield,
            "protocol": protocol,
        },
        # Legacy fields for existing clients / DB
        "category": get_category(score),
        "fatal_flaw": virus,
        "weapon_course": weapon,
        "shield_course": shield,
        "protocol_course": protocol,
        "recommended_track": weapon,
    }


def build_answer_lookup() -> dict[int, dict[str, str]]:
    lookup: dict[int, dict[str, str]] = {}
    for question in QUIZ_QUESTIONS:
        mapping: dict[str, str] = {}
        for letter, index in OPTION_INDEX_MAP.items():
            mapping[letter] = question["options"][index]
        lookup[question["id"]] = mapping
    return lookup
