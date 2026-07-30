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

# --- Allowed course catalogs (ONLY these may appear in reports/recommendations) ---
ALLOWED_BUSINESS_MODELS: frozenset[str] = frozenset(
    {
        "AI Automation",
        "AI Content Automation",
        "App Building using Flutter",
        "Python Full Course",
        "Amazon KDP",
        "Build a Real React App",
        "Building AI Agents with Claude and Anti Gravity",
        "Building Games Using Unreal Engine",
        "Framer Crash Course",
        "Wordpress Blog",
        "Print On Demand",
        "FULL CANVA TUTORIAL",
        "N8N AI Automation",
        "Trading advanced technical analysis",
    }
)

ALLOWED_PSYCHOLOGY: frozenset[str] = frozenset(
    {
        "Business Warfare",
        "Money Philosophy",
        "13 Syndicate Business Rule",
        "Zero to 1 Million",
        "9 to 5 Exit Strategy",
        "Compound Effect",
        "The Micro Business Protocol",
        "Hustle Hard",
        "Mastering Consistency",
        "Secret To Transformation",
        "Mastering Risk and Uncertainty",
    }
)

# Short keys → allowed catalog titles (reports use these strings only).
COURSE = {
    "ai_automation": "AI Automation",
    "ai_content_automation": "AI Content Automation",
    "agentic_claude": "Building AI Agents with Claude and Anti Gravity",
    "n8n_automation": "N8N AI Automation",
    "flutter": "App Building using Flutter",
    "python": "Python Full Course",
    "react": "Build a Real React App",
    "unreal": "Building Games Using Unreal Engine",
    "framer": "Framer Crash Course",
    "wordpress": "Wordpress Blog",
    "pod": "Print On Demand",
    "canva": "FULL CANVA TUTORIAL",
    "kdp": "Amazon KDP",
    "trading_technical": "Trading advanced technical analysis",
    "business_warfare": "Business Warfare",
    "money_philosophy": "Money Philosophy",
    "syndicate_13": "13 Syndicate Business Rule",
    "zero_million": "Zero to 1 Million",
    "exit_9_5": "9 to 5 Exit Strategy",
    "compound_effect": "Compound Effect",
    "micro_protocol": "The Micro Business Protocol",
    "hustle_hard": "Hustle Hard",
    "mastering_consistency": "Mastering Consistency",
    "secret_transformation": "Secret To Transformation",
    "risk_uncertainty": "Mastering Risk and Uncertainty",
}

# Map allowed catalog titles → published playlist titles (enrollment/tickets only).
WEAPON_TO_PLAYLIST: dict[str, str] = {
    "AI Automation": "AI Automations",
    "AI Content Automation": "Faceless YouTube AI Content Creator Course",
    "N8N AI Automation": "AI Automations",
    "Building AI Agents with Claude and Anti Gravity": "How To Build A.I Agents",
    "App Building using Flutter": "App Building (using Flutter)",
    "Python Full Course": "Python Programming",
    "Amazon KDP": "Book Publishing On Amazon (KINDLE)",
    "Build a Real React App": "Building Apps using React JS",
    "Building Games Using Unreal Engine": "Building Games Using Unreal Engine",
    "Framer Crash Course": "Rapid Web Building For Business (Vibe Coding)",
    "Wordpress Blog": "WordPress Blog",
    "Print On Demand": "Print On Demand Clothing",
    "FULL CANVA TUTORIAL": "Graphics Design Using Canva",
    "Trading advanced technical analysis": "Crypto Trading with Technical Analysis Course",
}

PSYCHOLOGY_TO_PLAYLIST: dict[str, str] = {
    "Business Warfare": "Business Warfare",
    "Money Philosophy": "Syndicate Money Philosophy",
    "13 Syndicate Business Rule": "Syndicate 13 Business Rules",
    "Zero to 1 Million": "Zero to One Million",
    "9 to 5 Exit Strategy": "The 9 to 5 Exit Strategy",
    "Compound Effect": "The Compound Effect",
    "The Micro Business Protocol": "The Micro Business Protocol",
    "Hustle Hard": "Hustle Hard",
    "Mastering Consistency": "Mastering Consistency",
    "Secret To Transformation": "The Secret To Transformation",
    "Mastering Risk and Uncertainty": "Mastering Risk and Uncertainty",
}

# Quiz free-ticket psychology programs — only these two may show a free-ticket button.
FREE_TICKET_PSYCHOLOGY_COURSES: frozenset[str] = frozenset(
    {
        COURSE["zero_million"],
        COURSE["exit_9_5"],
    }
)

ARCHETYPE_PROTOCOL_COURSES: list[tuple[str, str]] = [
    (COURSE["exit_9_5"], "FREE"),
    (COURSE["business_warfare"], "PAID"),
    (COURSE["risk_uncertainty"], "PAID"),
]

ARCHETYPE_SHIELD_COURSES: list[tuple[str, str]] = [
    (COURSE["zero_million"], "FREE"),
    (COURSE["micro_protocol"], "PAID"),
]

ARCHETYPE_PSYCHOLOGY_PAID: list[str] = [
    COURSE["micro_protocol"],
    COURSE["business_warfare"],
    COURSE["risk_uncertainty"],
]

ARCHETYPE_PSYCHOLOGY_FREE: list[str] = [
    COURSE["zero_million"],
    COURSE["exit_9_5"],
]

_SHARED_ARCHETYPE_PSYCHOLOGY: list[str] = ARCHETYPE_PSYCHOLOGY_PAID + ARCHETYPE_PSYCHOLOGY_FREE

# --- A. Archetype → Weapon (business models) — per Re-Updated Quiz Funnel spec ---
ARCHETYPE_WEAPON_MODELS: dict[str, dict[str, list[str]]] = {
    "Ghost Architect": {
        "entry": [
            COURSE["trading_technical"],
            COURSE["ai_content_automation"],
            COURSE["unreal"],
        ],
        "elite": [
            COURSE["trading_technical"],
            COURSE["ai_content_automation"],
            COURSE["unreal"],
        ],
    },
    "Digital Raider": {
        "entry": [
            COURSE["agentic_claude"],
            COURSE["unreal"],
            COURSE["wordpress"],
            COURSE["framer"],
        ],
        "elite": [
            COURSE["agentic_claude"],
            COURSE["unreal"],
            COURSE["wordpress"],
            COURSE["framer"],
        ],
    },
    "Creative Infiltrator": {
        "entry": [
            COURSE["ai_content_automation"],
            COURSE["pod"],
            COURSE["kdp"],
        ],
        "elite": [
            COURSE["ai_content_automation"],
            COURSE["pod"],
            COURSE["kdp"],
        ],
    },
    "Asset Grinder": {
        "entry": [
            COURSE["ai_content_automation"],
            COURSE["pod"],
            COURSE["kdp"],
            COURSE["agentic_claude"],
        ],
        "elite": [
            COURSE["ai_content_automation"],
            COURSE["pod"],
            COURSE["kdp"],
            COURSE["agentic_claude"],
        ],
    },
}

# --- Archetype → Psychology (shields) — same paid + free pool for every archetype ---
ARCHETYPE_PSYCHOLOGY_MODELS: dict[str, list[str]] = {
    "Ghost Architect": list(_SHARED_ARCHETYPE_PSYCHOLOGY),
    "Digital Raider": list(_SHARED_ARCHETYPE_PSYCHOLOGY),
    "Creative Infiltrator": list(_SHARED_ARCHETYPE_PSYCHOLOGY),
    "Asset Grinder": list(_SHARED_ARCHETYPE_PSYCHOLOGY),
}

# Virus → paid shield course (Micro Business Protocol or Business Warfare only).
VIRUS_PAID_SHIELD: dict[str, str] = {
    "Loner": COURSE["business_warfare"],
    "Victim": COURSE["business_warfare"],
    "Emotional Mover": COURSE["business_warfare"],
    "Identity Crisis": COURSE["business_warfare"],
    "Chaos Agent": COURSE["micro_protocol"],
    "Visionary": COURSE["micro_protocol"],
    "Order Taker": COURSE["micro_protocol"],
    "Amateur": COURSE["micro_protocol"],
    "Quitter": COURSE["micro_protocol"],
    "Spender": COURSE["micro_protocol"],
    "Slow Burner": COURSE["micro_protocol"],
    "Employee": COURSE["micro_protocol"],
}

# Legacy per-archetype virus map — paid shields only.
ARCHETYPE_VIRUS_SHIELD: dict[str, dict[str, str]] = {
    archetype: dict(VIRUS_PAID_SHIELD)
    for archetype in ("Ghost Architect", "Digital Raider", "Creative Infiltrator", "Asset Grinder")
}

# Legacy global virus map (fallback when archetype omitted) — paid shields only.
SHIELD_BY_VIRUS: dict[str, str] = dict(VIRUS_PAID_SHIELD)

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

# --- C. Protocol by power level (score) — free psychology catalog only ---
PROTOCOL_BY_DESIGNATION: dict[str, str] = {
    "Street Soldier": COURSE["zero_million"],
    "Rogue Operator": COURSE["exit_9_5"],
    "Syndicate Specialist": COURSE["exit_9_5"],
    "Prospect": COURSE["zero_million"],
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
            return _assert_allowed_psychology(by_virus[virus])
        pool = ARCHETYPE_PSYCHOLOGY_MODELS.get(archetype) or []
        if pool:
            idx = sum(ord(c) for c in virus) % len(pool)
            return _assert_allowed_psychology(pool[idx])
    shield = SHIELD_BY_VIRUS.get(virus, COURSE["micro_protocol"])
    return _assert_allowed_psychology(shield)


def map_weapon_to_playlist_title(name: str) -> str:
    """Resolve allowed business model title to published playlist for tickets."""
    title = _assert_allowed_weapon(name)
    return WEAPON_TO_PLAYLIST.get(title, title)


def map_psychology_to_playlist_title(name: str) -> str:
    """Resolve allowed psychology title to published playlist for tickets."""
    title = _assert_allowed_psychology(name)
    return PSYCHOLOGY_TO_PLAYLIST.get(title, title)


def normalize_free_ticket_title(title: str) -> str | None:
    """Return catalog title when `title` matches a free-ticket psychology program."""
    raw = (title or "").strip()
    if not raw:
        return None
    lower = raw.lower()
    for catalog in FREE_TICKET_PSYCHOLOGY_COURSES:
        if catalog.lower() == lower:
            return catalog
    for catalog in FREE_TICKET_PSYCHOLOGY_COURSES:
        db_title = PSYCHOLOGY_TO_PLAYLIST.get(catalog, catalog)
        if db_title.lower() == lower:
            return catalog
    legacy_db_titles = {
        "zero to one million": COURSE["zero_million"],
        "the 9 to 5 exit strategy": COURSE["exit_9_5"],
    }
    if lower in legacy_db_titles:
        return legacy_db_titles[lower]
    return None


def is_free_ticket_psychology_course(title: str) -> bool:
    return normalize_free_ticket_title(title) is not None


def free_ticket_catalog_titles_from_stack(shield: str, protocol: str) -> list[str]:
    """Eligible free-ticket catalog titles present in shield and/or protocol only."""
    out: list[str] = []
    for name in (shield, protocol):
        catalog = normalize_free_ticket_title(name)
        if catalog and catalog not in out:
            out.append(catalog)
    return out


def free_ticket_playlist_titles_from_stack(shield: str, protocol: str) -> list[str]:
    """Published playlist titles to unlock — only shield/protocol slots in the free-ticket catalog."""
    out: list[str] = []
    for catalog in free_ticket_catalog_titles_from_stack(shield, protocol):
        db_title = map_psychology_to_playlist_title(catalog)
        if db_title not in out:
            out.append(db_title)
    return out


def free_ticket_playlist_title_for_catalog(title: str) -> str | None:
    """Single free-ticket catalog title → published playlist title."""
    catalog = normalize_free_ticket_title(title)
    if not catalog:
        return None
    return map_psychology_to_playlist_title(catalog)


def all_free_ticket_playlist_titles() -> list[str]:
    """Both quiz free-ticket programs as published playlist titles."""
    out: list[str] = []
    for catalog in sorted(FREE_TICKET_PSYCHOLOGY_COURSES, key=str.lower):
        db_title = map_psychology_to_playlist_title(catalog)
        if db_title not in out:
            out.append(db_title)
    return out


def _assert_allowed_weapon(course: str) -> str:
    if course in BANNED_COURSES:
        raise ValueError(f"Banned course recommendation blocked: {course}")
    if course not in ALLOWED_BUSINESS_MODELS:
        raise ValueError(f"Business model not in allowed catalog: {course}")
    return course


def _assert_allowed_psychology(course: str) -> str:
    if course in BANNED_COURSES:
        raise ValueError(f"Banned course recommendation blocked: {course}")
    if course not in ALLOWED_PSYCHOLOGY:
        raise ValueError(f"Psychology course not in allowed catalog: {course}")
    return course


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
    shield = PROTOCOL_BY_DESIGNATION.get(label, COURSE["secret_transformation"])
    return _assert_allowed_psychology(shield)


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
    return _assert_allowed_weapon(pool[idx])


def _assert_allowed_course(course: str) -> str:
    """Backward-compatible guard — must be in weapons or psychology catalog."""
    if course in BANNED_COURSES:
        raise ValueError(f"Banned course recommendation blocked: {course}")
    if course in ALLOWED_BUSINESS_MODELS:
        return course
    if course in ALLOWED_PSYCHOLOGY:
        return course
    raise ValueError(f"Course not in allowed catalog: {course}")


def get_archetype_catalog(archetype: str) -> dict[str, list[str]]:
    """All allowed business models and psychology courses for an archetype."""
    weapons = _weapon_courses_for_archetype(archetype)
    return {
        "business_models": [_assert_allowed_weapon(c) for c in weapons],
        "psychology_paid": [_assert_allowed_psychology(c) for c in ARCHETYPE_PSYCHOLOGY_PAID],
        "psychology_free": [_assert_allowed_psychology(c) for c in ARCHETYPE_PSYCHOLOGY_FREE],
        "psychology": [
            _assert_allowed_psychology(c)
            for c in (ARCHETYPE_PSYCHOLOGY_MODELS.get(archetype) or _SHARED_ARCHETYPE_PSYCHOLOGY)
        ],
        "shield_courses": [title for title, _ in ARCHETYPE_SHIELD_COURSES],
        "protocol_courses": [title for title, _ in ARCHETYPE_PROTOCOL_COURSES],
    }


def _weapon_courses_for_archetype(archetype: str) -> list[str]:
    models = ARCHETYPE_WEAPON_MODELS.get(archetype) or ARCHETYPE_WEAPON_MODELS["Asset Grinder"]
    return list(dict.fromkeys((models.get("entry") or []) + (models.get("elite") or [])))


def _stack_course_bullet(title: str, access: str) -> str:
    if access.upper() == "FREE":
        return f"• {title} (FREE)"
    return f"• {title}"


def build_section_c_report(archetype: str) -> str:
    """Deterministic Section C — full Weapon / Shield / Protocol stacks per archetype."""
    weapons = _weapon_courses_for_archetype(archetype)
    lines = [
        "Section C: THE SYNDICATE DIAGNOSIS",
        f"Based on your {archetype} archetype, The Syndicate recommends these courses:",
        "",
        "1. THE WEAPON (Primary Business Models):",
    ]
    lines.extend(f"• {title}" for title in weapons)
    lines.append("2. THE SHIELD (Behavioral Correction):")
    for title, access in ARCHETYPE_SHIELD_COURSES:
        lines.append(_stack_course_bullet(title, access))
    lines.append("3. THE PROTOCOL (Strategic Foundation):")
    for title, access in ARCHETYPE_PROTOCOL_COURSES:
        lines.append(_stack_course_bullet(title, access))
    return "\n".join(lines)


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
