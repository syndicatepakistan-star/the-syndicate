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

# Canonical DB playlist titles (fixtures/stream_playlist_backup.json).
# User labels mapped 1:1 where the exact title exists in the catalog.
# User label → DB title when no exact playlist match exists:
#   "Mastering Risk and Uncertainty" → The Art of Critical Thinking
#   "Micro business protocol" → Prompt Engineering
#   "Building AI Agents with Claude and Anti Gravity" → How To Build A.I Agents
#   "AI Content Automation" → Faceless YouTube AI Content Creator Course
COURSE = {
    "trading_technical": "Crypto Trading with Technical Analysis Course",
    "ai_content": "Faceless YouTube AI Content Creator Course",
    "unreal": "Building Games Using Unreal Engine",
    "ai_agents": "How To Build A.I Agents",
    "wordpress": "WordPress Blog",
    "framer": "Framer Crash Course",
    "pod": "Print On Demand Clothing",
    "kdp": "Book Publishing On Amazon (KINDLE)",
    "business_warfare": "The Art of Mastering Human Behavior in Business",
    "syndicate_13": "Syndicate 13 Business Rules",
    "micro_protocol": "Prompt Engineering",
    "risk_uncertainty": "The Art of Critical Thinking",
    "zero_million": "Zero to One Million",
    "exit_9_5": "The 9 to 5 Exit Strategy",
    "mastering_consistency": "Mastering Consistency",
    "compound_effect": "The Compound Effect",
    "money_philosophy": "Syndicate Money Philosophy",
    "secret_transformation": "The Secret To Transformation",
    "hustle_hard": "Hustle Hard",
    "empire_building": "The Business of Empire Building",
}

# --- A. Archetype → Weapon (business models) ---
ARCHETYPE_WEAPON_MODELS: dict[str, dict[str, list[str]]] = {
    "Ghost Architect": {
        "entry": [COURSE["trading_technical"]],
        "elite": [COURSE["ai_content"], COURSE["unreal"]],
    },
    "Digital Raider": {
        "entry": [COURSE["wordpress"], COURSE["framer"]],
        "elite": [COURSE["ai_agents"], COURSE["unreal"]],
    },
    "Creative Infiltrator": {
        "entry": [COURSE["pod"]],
        "elite": [COURSE["ai_content"], COURSE["kdp"]],
    },
    "Asset Grinder": {
        "entry": [COURSE["pod"], COURSE["kdp"]],
        "elite": [COURSE["ai_content"], COURSE["ai_agents"]],
    },
}

# --- Archetype → Psychology (shields) — only courses from user lists ---
ARCHETYPE_PSYCHOLOGY_MODELS: dict[str, list[str]] = {
    "Ghost Architect": [
        COURSE["business_warfare"],
        COURSE["syndicate_13"],
        COURSE["micro_protocol"],
    ],
    "Digital Raider": [
        COURSE["risk_uncertainty"],
        COURSE["micro_protocol"],
        COURSE["zero_million"],
    ],
    "Creative Infiltrator": [
        COURSE["risk_uncertainty"],
        COURSE["micro_protocol"],
        COURSE["zero_million"],
        COURSE["exit_9_5"],
    ],
    "Asset Grinder": [
        COURSE["risk_uncertainty"],
        COURSE["micro_protocol"],
        COURSE["zero_million"],
        COURSE["exit_9_5"],
    ],
}

# Virus → shield course within each archetype's psychology pool (deterministic).
ARCHETYPE_VIRUS_SHIELD: dict[str, dict[str, str]] = {
    "Ghost Architect": {
        "Loner": COURSE["business_warfare"],
        "Chaos Agent": COURSE["syndicate_13"],
        "Visionary": COURSE["syndicate_13"],
        "Order Taker": COURSE["micro_protocol"],
        "Amateur": COURSE["micro_protocol"],
        "Quitter": COURSE["syndicate_13"],
        "Spender": COURSE["micro_protocol"],
        "Emotional Mover": COURSE["business_warfare"],
        "Identity Crisis": COURSE["business_warfare"],
        "Slow Burner": COURSE["micro_protocol"],
        "Employee": COURSE["syndicate_13"],
        "Victim": COURSE["business_warfare"],
    },
    "Digital Raider": {
        "Emotional Mover": COURSE["risk_uncertainty"],
        "Order Taker": COURSE["micro_protocol"],
        "Amateur": COURSE["zero_million"],
        "Quitter": COURSE["risk_uncertainty"],
        "Spender": COURSE["micro_protocol"],
        "Loner": COURSE["risk_uncertainty"],
        "Chaos Agent": COURSE["zero_million"],
        "Visionary": COURSE["zero_million"],
        "Identity Crisis": COURSE["risk_uncertainty"],
        "Slow Burner": COURSE["zero_million"],
        "Employee": COURSE["zero_million"],
        "Victim": COURSE["risk_uncertainty"],
    },
    "Creative Infiltrator": {
        "Emotional Mover": COURSE["risk_uncertainty"],
        "Order Taker": COURSE["micro_protocol"],
        "Amateur": COURSE["zero_million"],
        "Employee": COURSE["exit_9_5"],
        "Quitter": COURSE["risk_uncertainty"],
        "Spender": COURSE["micro_protocol"],
        "Loner": COURSE["exit_9_5"],
        "Chaos Agent": COURSE["zero_million"],
        "Visionary": COURSE["exit_9_5"],
        "Identity Crisis": COURSE["risk_uncertainty"],
        "Slow Burner": COURSE["zero_million"],
        "Victim": COURSE["exit_9_5"],
    },
    "Asset Grinder": {
        "Emotional Mover": COURSE["risk_uncertainty"],
        "Order Taker": COURSE["micro_protocol"],
        "Amateur": COURSE["zero_million"],
        "Employee": COURSE["exit_9_5"],
        "Quitter": COURSE["risk_uncertainty"],
        "Spender": COURSE["micro_protocol"],
        "Loner": COURSE["exit_9_5"],
        "Chaos Agent": COURSE["zero_million"],
        "Visionary": COURSE["exit_9_5"],
        "Identity Crisis": COURSE["risk_uncertainty"],
        "Slow Burner": COURSE["zero_million"],
        "Victim": COURSE["exit_9_5"],
    },
}

# Legacy global virus map (fallback when archetype omitted) — never Business Persuasion.
SHIELD_BY_VIRUS: dict[str, str] = {
    "Quitter": COURSE["mastering_consistency"],
    "Employee": COURSE["exit_9_5"],
    "Chaos Agent": COURSE["syndicate_13"],
    "Victim": COURSE["money_philosophy"],
    "Spender": COURSE["compound_effect"],
    "Emotional Mover": COURSE["risk_uncertainty"],
    "Loner": COURSE["business_warfare"],
    "Order Taker": COURSE["micro_protocol"],
    "Identity Crisis": COURSE["secret_transformation"],
    "Slow Burner": COURSE["hustle_hard"],
    "Amateur": COURSE["zero_million"],
    "Visionary": COURSE["syndicate_13"],
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
    "Street Soldier": COURSE["secret_transformation"],
    "Rogue Operator": COURSE["exit_9_5"],
    "Syndicate Specialist": COURSE["risk_uncertainty"],
    "Prospect": COURSE["empire_building"],
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


def get_recommended_shield(virus: str, archetype: str | None = None) -> str:
    """Shield from archetype psychology pool; falls back to global map without archetype."""
    if archetype:
        by_virus = ARCHETYPE_VIRUS_SHIELD.get(archetype, {})
        if virus in by_virus:
            return _assert_allowed_course(by_virus[virus])
        pool = ARCHETYPE_PSYCHOLOGY_MODELS.get(archetype) or []
        if pool:
            idx = sum(ord(c) for c in virus) % len(pool)
            return _assert_allowed_course(pool[idx])
    shield = SHIELD_BY_VIRUS.get(virus, COURSE["syndicate_13"])
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


def get_archetype_catalog(archetype: str) -> dict[str, list[str]]:
    """All allowed business models and psychology courses for an archetype."""
    weapons = ARCHETYPE_WEAPON_MODELS.get(archetype) or ARCHETYPE_WEAPON_MODELS["Asset Grinder"]
    business_models = list(dict.fromkeys((weapons.get("entry") or []) + (weapons.get("elite") or [])))
    return {
        "business_models": [_assert_allowed_course(c) for c in business_models],
        "psychology": [
            _assert_allowed_course(c)
            for c in (ARCHETYPE_PSYCHOLOGY_MODELS.get(archetype) or [])
        ],
    }


def build_recommendation(answers: list[dict]) -> dict[str, Any]:
    """
    Deterministic Triple-Threat Execution Stack JSON.
    """
    score = compute_score(answers)
    designation = get_designation(score)
    archetype = detect_archetype(answers)
    virus = detect_virus(answers)
    weapon = get_weapon_course(archetype, score, answers)
    shield = get_recommended_shield(virus, archetype)
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
        "archetype_catalog": get_archetype_catalog(archetype),
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
