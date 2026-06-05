from .quiz_data import QUIZ_QUESTIONS

SCORE_MAP = {"A": 1, "B": 3, "C": 5, "D": 10}
OPTION_INDEX_MAP = {"A": 0, "B": 1, "C": 2, "D": 3}

# Part 3 — Master mapping: Virus → Shield course (playlist titles in DB).
SHIELD_BY_VIRUS = {
    "The Quitter": "Mastering Consistency",
    "The Magic Pill Delusion": "Mastering Consistency",
    "Analysis Paralysis": "Mastering Consistency",
    "The Employee": "The 9 to 5 Exit Strategy",
    "The Chaos Agent": "Syndicate 13 Business Rules",
    "The Victim": "Syndicate Money Philosophy",
    "The Spender": "The Compound Effect",
    "The Financial Leak": "The Compound Effect",
    "The Emotional Mover": "The Art of Critical Thinking",
    "The Loner": "The Art of Mastering Human Behavior in Business",
    "Crabs in a Bucket": "The Art of Mastering Human Behavior in Business",
    "The Order Taker": "The Art Of Business Persuasion",
    "The Identity Crisis": "The Secret To Transformation",
    "The Slow Burner": "Hustle Hard",
    "The Amateur": "Zero to One Million",
    "The Visionary": "Syndicate 13 Business Rules",
}

# Part 3 — Archetype → Weapon (business model courses).
ARCHETYPE_WEAPON_MATRIX = {
    "Profit Raider": {
        "entry": "Affiliate Marketing / Print On Demand Clothing",
        "elite": "Crypto Trading with Technical Analysis Course / WordPress Blog",
    },
    "Attention Broker": {
        "entry": "Graphics Design Using Canva / Faceless YouTube AI Content Creator Course",
        "elite": "Print On Demand Clothing / Book Publishing On Amazon (KINDLE)",
    },
    "System Architect": {
        "entry": "Book Publishing On Amazon (KINDLE) / Prompt Engineering",
        "elite": "AI Automations / Framer Crash Course",
    },
    "Ghost Architect": {
        "entry": "Python Programming",
        "elite": "How To Build A.I Agents / Building Apps using React JS",
    },
}

PROTOCOL_BY_DESIGNATION = {
    "THE STREET SOLDIER": "The Secret To Transformation",
    "THE ROGUE OPERATOR": "The 9 to 5 Exit Strategy",
    "THE SYNDICATE SPECIALIST": "The Art of Critical Thinking",
    "THE PROSPECT (EMPIRE TIER)": "The Business of Empire Building",
}

ARCHETYPE_BY_Q5_OPTION = {
    "A": "Profit Raider",
    "B": "Attention Broker",
    "C": "System Architect",
    "D": "Ghost Architect",
}

# Diagnostic questions → detected virus label (Part 3 logic table).
FATAL_FLAW_BY_QUESTION_OPTION = {
    1: {
        "A": "The Slow Burner",
        "B": "The Victim",
        "C": "The Chaos Agent",
        "D": "The Loner",
    },
    3: {
        "A": "The Magic Pill Delusion",
        "B": "The Victim",
        "C": "The Amateur",
        "D": "The Visionary",
    },
    8: {
        "A": "The Magic Pill Delusion",
        "B": "The Spender",
        "C": "Analysis Paralysis",
        "D": "The Loner",
    },
    9: {
        "A": "The Quitter",
        "B": "The Order Taker",
        "C": "The Amateur",
        "D": None,
    },
    10: {
        "A": "The Loner",
        "B": "The Spender",
        "C": "The Amateur",
        "D": None,
    },
    11: {
        "A": "The Victim",
        "B": "The Spender",
        "C": "The Loner",
        "D": "The Chaos Agent",
    },
    16: {
        "A": "The Order Taker",
        "B": "The Identity Crisis",
        "C": "The Slow Burner",
        "D": None,
    },
}

HIGH_STAKES_DIAGNOSTIC_IDS = {10}


def compute_score(answers: list[dict]) -> int:
    return sum(SCORE_MAP[item["selected_option"]] for item in answers)


def get_category(score: int) -> str:
    if 17 <= score <= 50:
        return "THE STREET SOLDIER"
    if 51 <= score <= 100:
        return "THE ROGUE OPERATOR"
    if 101 <= score <= 140:
        return "THE SYNDICATE SPECIALIST"
    return "THE PROSPECT (EMPIRE TIER)"


def get_designation_short(designation: str) -> str:
    mapping = {
        "THE STREET SOLDIER": "SOLDIER",
        "THE ROGUE OPERATOR": "OPERATOR",
        "THE SYNDICATE SPECIALIST": "SPECIALIST",
        "THE PROSPECT (EMPIRE TIER)": "PROSPECT",
    }
    return mapping.get(designation, designation)


def build_answer_lookup() -> dict[int, dict[str, str]]:
    lookup: dict[int, dict[str, str]] = {}
    for question in QUIZ_QUESTIONS:
        mapping: dict[str, str] = {}
        for letter, index in OPTION_INDEX_MAP.items():
            mapping[letter] = question["options"][index]
        lookup[question["id"]] = mapping
    return lookup


def detect_archetype(answers: list[dict]) -> str:
    archetype_counts = {
        "Ghost Architect": 0,
        "Attention Broker": 0,
        "System Architect": 0,
        "Profit Raider": 0,
    }
    q7_archetype_map = {
        "A": "Profit Raider",
        "B": "Ghost Architect",
        "C": "Attention Broker",
        "D": "System Architect",
    }
    for item in answers:
        question_id = item["question_id"]
        letter = item["selected_option"]
        if question_id == 5:
            mapped = ARCHETYPE_BY_Q5_OPTION.get(letter)
            if mapped:
                archetype_counts[mapped] += 1
        elif question_id == 7:
            mapped = q7_archetype_map.get(letter)
            if mapped:
                archetype_counts[mapped] += 1

    for archetype in ["Ghost Architect", "Attention Broker", "System Architect", "Profit Raider"]:
        if archetype_counts[archetype] == max(archetype_counts.values()):
            return archetype
    return "System Architect"


def detect_fatal_flaw(answers: list[dict]) -> str:
    diagnostic_question_ids = set(FATAL_FLAW_BY_QUESTION_OPTION.keys())
    weighted_scores: dict[str, int] = {}
    frequency: dict[str, int] = {}

    for item in answers:
        question_id = item["question_id"]
        if question_id not in diagnostic_question_ids:
            continue

        letter = item.get("selected_option")
        if letter not in SCORE_MAP:
            continue

        virus = FATAL_FLAW_BY_QUESTION_OPTION.get(question_id, {}).get(letter)
        if not virus:
            continue

        frequency[virus] = frequency.get(virus, 0) + 1
        weight = 1 + SCORE_MAP[letter]
        if question_id in HIGH_STAKES_DIAGNOSTIC_IDS:
            weight += 6
        weighted_scores[virus] = weighted_scores.get(virus, 0) + weight

    if not weighted_scores:
        return "Analysis Paralysis"

    priority_order = list(SHIELD_BY_VIRUS.keys())
    ranked = sorted(
        weighted_scores.keys(),
        key=lambda virus: (
            weighted_scores[virus],
            frequency.get(virus, 0),
            -priority_order.index(virus) if virus in priority_order else -9999,
        ),
        reverse=True,
    )
    return ranked[0]


def get_recommended_shield(fatal_flaw: str) -> str:
    normalized = (fatal_flaw or "").strip()
    if normalized in SHIELD_BY_VIRUS:
        return SHIELD_BY_VIRUS[normalized]
    lowered = normalized.lower()
    for key, value in SHIELD_BY_VIRUS.items():
        if key.lower() == lowered:
            return value
    return "Syndicate 13 Business Rules"


def get_recommended_protocol(designation: str) -> str:
    return PROTOCOL_BY_DESIGNATION.get(designation, "Syndicate 13 Business Rules")


def _get_budget_tier_from_answers(answers: list[dict]) -> str | None:
    for item in answers:
        if item.get("question_id") != 14:
            continue
        letter = item.get("selected_option")
        if letter in {"A", "B"}:
            return "entry"
        if letter in {"C", "D"}:
            return "elite"
    return None


def get_weapon_course(archetype: str, score: int, answers: list[dict] | None = None) -> str:
    mapping = ARCHETYPE_WEAPON_MATRIX.get(archetype)
    if not mapping:
        return "Python Programming"

    budget_tier = _get_budget_tier_from_answers(answers or [])
    if budget_tier in {"entry", "elite"}:
        return mapping[budget_tier]

    return mapping["entry"] if score <= 100 else mapping["elite"]
