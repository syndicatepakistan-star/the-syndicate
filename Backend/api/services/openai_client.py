"""OpenAI API helpers for ingest and challenge generation."""
from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from django.conf import settings
from openai import OpenAI


def _normalize_api_key(raw: str) -> str:
    key = (raw or "").strip().strip("\ufeff")
    if len(key) >= 2 and key[0] == key[-1] and key[0] in "\"'":
        key = key[1:-1].strip()
    return key


def _client() -> OpenAI:
    key = _normalize_api_key(getattr(settings, "OPENAI_API_KEY", None) or "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set in environment or .env")
    return OpenAI(api_key=key)


def _model() -> str:
    return getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")


def chat_json(
    system: str,
    user: str,
    *,
    max_tokens: int | None = None,
    temperature: float = 0.7,
) -> dict[str, Any]:
    """Return parsed JSON object from OpenAI chat completion."""
    client = _client()
    kwargs: dict[str, Any] = {
        "model": _model(),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "response_format": {"type": "json_object"},
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    resp = client.chat.completions.create(**kwargs)
    text = (resp.choices[0].message.content or "").strip()
    return json.loads(text)


def validate_user_mission_response_for_scoring(
    *,
    challenge_title: str,
    challenge_description: str,
    example_tasks: list[str],
    difficulty: str,
    user_response: str,
) -> dict[str, Any]:
    """
    Pre-scoring gate: model returns strict JSON with is_valid (bool) and reason.
    Caller treats any failure to produce a valid structure as is_valid False.
    """
    from .prompts import MISSION_RESPONSE_VALIDATION_SYSTEM

    desc = (challenge_description or "").strip()[:2800]
    ex_lines = []
    for t in (example_tasks or [])[:5]:
        s = str(t).strip()[:500]
        if s:
            ex_lines.append(s)
    ex_text = "\n".join(f"- {line}" for line in ex_lines)[:1400]
    payload = {
        "challenge_title": (challenge_title or "").strip()[:500],
        "challenge_description": desc,
        "example_tasks_text": ex_text or "(none provided)",
        "difficulty": (difficulty or "medium").strip().lower()[:16],
        "user_response": (user_response or "").strip()[:8000],
    }
    user = "Mission validation input (JSON):\n" + json.dumps(payload, ensure_ascii=False)
    raw = chat_json(MISSION_RESPONSE_VALIDATION_SYSTEM, user, temperature=0.2, max_tokens=280)
    return _normalize_mission_validation(raw)


def _normalize_mission_validation(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        return {"is_valid": False, "reason": "Validation response was not usable."}
    v = raw.get("is_valid")
    if v is True:
        is_valid = True
    elif v is False:
        is_valid = False
    elif isinstance(v, str):
        s = v.strip().lower()
        is_valid = s in ("true", "1", "yes")
    else:
        is_valid = False
    reason = str(raw.get("reason") or "").strip()
    if not reason:
        reason = "Response accepted for scoring." if is_valid else "Response rejected as invalid or off-topic."
    return {"is_valid": is_valid, "reason": reason[:500]}


def attest_user_mission_response(
    *,
    challenge_title: str,
    challenge_description: str,
    example_tasks: list[str],
    difficulty: str,
    user_response: str,
) -> dict[str, Any] | None:
    """
    Qualitative attestation of the user's mission response vs mission rules (OpenAI JSON).
    Returns None if the API fails or key is missing (caller wraps).
    """
    from .prompts import MISSION_RESPONSE_ATTEST_SYSTEM

    desc = (challenge_description or "").strip()[:2800]
    ex_lines = []
    for t in (example_tasks or [])[:5]:
        s = str(t).strip()[:500]
        if s:
            ex_lines.append(s)
    ex_text = "\n".join(f"- {line}" for line in ex_lines)[:1400]
    payload = {
        "challenge_title": (challenge_title or "").strip()[:500],
        "challenge_description": desc,
        "example_tasks_text": ex_text or "(none provided)",
        "difficulty": (difficulty or "medium").strip().lower()[:16],
        "user_response": (user_response or "").strip()[:8000],
    }
    user = "Mission attestation input (JSON):\n" + json.dumps(payload, ensure_ascii=False)
    try:
        raw = chat_json(MISSION_RESPONSE_ATTEST_SYSTEM, user, temperature=0.35, max_tokens=700)
    except Exception:
        return None
    return _normalize_mission_attestation(raw)


def _normalize_mission_attestation(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    verdict = str(raw.get("verdict") or "partial").strip().lower()
    if verdict not in ("pass", "partial", "needs_work"):
        verdict = "partial"
    att = str(raw.get("attestation") or "").strip()
    if not att:
        return None
    att = att[:2400]
    checks = _coerce_str_list(raw.get("checks"), max_items=6)
    suggestions = _coerce_str_list(raw.get("suggestions"), max_items=6)
    if len(checks) < 1:
        checks = ["Response reviewed against mission title and description."]
    return {
        "verdict": verdict,
        "attestation": att,
        "checks": checks[:6],
        "suggestions": suggestions[:6],
    }


def extract_mindsets_from_document(document_text: str) -> dict[str, Any]:
    from .prompts import INGEST_SYSTEM

    user = (
        "Below is extracted text from the user's saved document (e.g. PDF, transcript, or notes). "
        "Extract mindsets as instructed.\n\n"
        "--- DOCUMENT START ---\n"
        f"{document_text}\n"
        "--- DOCUMENT END ---"
    )
    # Large JSON payloads need a high ceiling; omitting max_tokens can truncate and break JSON.parse.
    return chat_json(INGEST_SYSTEM, user, temperature=0.35, max_tokens=16_384)


def _coerce_str_list(val: Any, *, max_items: int = 64) -> list[str]:
    if val is None:
        return []
    if isinstance(val, str):
        s = val.strip()
        return [s] if s else []
    if isinstance(val, list):
        out: list[str] = []
        for x in val[:max_items]:
            t = str(x).strip()
            if t:
                out.append(t)
        return out
    return []


def normalize_mindset_ingest_payload(data: dict[str, Any] | None) -> dict[str, Any]:
    """
    Stable MindsetKnowledge.payload shape for DB + challenge generators:
    mindsets[].{name, patterns, habits, benefits, notes}, themes[], anti_patterns[].
    """
    raw = dict(data or {})
    mindsets_in = raw.get("mindsets")
    rows: list[dict[str, Any]] = []
    if isinstance(mindsets_in, list):
        for m in mindsets_in:
            if not isinstance(m, dict):
                continue
            name = str(m.get("name") or "").strip() or "Mindset"
            rows.append(
                {
                    "name": name,
                    "patterns": _coerce_str_list(m.get("patterns")),
                    "habits": _coerce_str_list(m.get("habits")),
                    "benefits": _coerce_str_list(m.get("benefits")),
                    "notes": str(m.get("notes") or "").strip(),
                }
            )
    raw["mindsets"] = rows
    raw["themes"] = _coerce_str_list(raw.get("themes"))
    raw["anti_patterns"] = _coerce_str_list(raw.get("anti_patterns"))
    return raw


def _split_into_three(text: str) -> list[str]:
    """Best-effort split of legacy single-string examples/benefits into three items."""
    t = (text or "").strip()
    if not t:
        return ["", "", ""]
    for sep in ("\n", ";"):
        if sep in t:
            parts = [p.strip() for p in t.split(sep) if p.strip()]
            if len(parts) >= 2:
                while len(parts) < 3:
                    parts.append("")
                return parts[:3]
    parts = re.split(r"(?<=[.!?])\s+", t)
    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) >= 3:
        return parts[:3]
    if len(parts) == 2:
        return [parts[0], parts[1], ""]
    if len(parts) == 1:
        return [parts[0], "", ""]
    return ["", "", ""]


def _sentence_chunks(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", (text or "").strip())
    return [p.strip() for p in parts if p and p.strip()]


def _ensure_membership_paragraph(
    paragraph: str,
    *,
    keyword: str = "",
    category: str = "",
    target_sentences: int = 5,
) -> str:
    sentences = _sentence_chunks(paragraph)
    if len(sentences) >= target_sentences:
        return " ".join(sentences[:6]).strip()

    topic = (keyword or "the topic").strip()
    cat = (category or "others").strip()
    fillers = [
        f"Use {topic} as a daily operating principle rather than a one-time idea.",
        "Set one measurable standard so progress is visible instead of vague.",
        "Keep execution simple, then repeat it until results become reliable under pressure.",
        f"In {cat} decisions, prefer clarity and consistency over short-term noise.",
        "Review outcomes weekly, keep what works, and remove friction from the next cycle.",
        "The edge compounds when disciplined actions are repeated without unnecessary complexity.",
    ]
    i = 0
    while len(sentences) < target_sentences and i < len(fillers):
        candidate = fillers[i]
        if candidate not in sentences:
            sentences.append(candidate)
        i += 1
    return " ".join(sentences[:6]).strip()


def _normalize_membership_paragraphs(paragraphs: list[str], *, keyword: str = "", category: str = "") -> list[str]:
    cleaned = [str(x).strip() for x in paragraphs if str(x).strip()]
    while len(cleaned) < 3:
        cleaned.append("")
    cleaned = cleaned[:3]
    return [
        _ensure_membership_paragraph(p, keyword=keyword, category=category, target_sentences=5)
        for p in cleaned
    ]


def normalize_challenge_payload(ch: dict[str, Any]) -> dict[str, Any]:
    """Ensure example_tasks and benefits_list (3 each); keep legacy example_task / benefits for older clients."""
    out = dict(ch)
    legacy_ex = str(out.get("example_task") or "").strip()
    legacy_ben = str(out.get("benefits") or "").strip()

    raw_tasks = out.get("example_tasks")
    if isinstance(raw_tasks, list):
        tasks = [str(x).strip() for x in raw_tasks if str(x).strip()]
    else:
        tasks = []
    if len(tasks) < 3:
        if legacy_ex:
            tasks = _split_into_three(legacy_ex)
        else:
            tasks = tasks + [""] * (3 - len(tasks))
    while len(tasks) < 3:
        tasks.append("")
    out["example_tasks"] = tasks[:3]

    raw_ben = out.get("benefits_list")
    if isinstance(raw_ben, list):
        bens = [str(x).strip() for x in raw_ben if str(x).strip()]
    else:
        bens = []
    if len(bens) < 3:
        if legacy_ben:
            bens = _split_into_three(legacy_ben)
        else:
            bens = bens + [""] * (3 - len(bens))
    while len(bens) < 3:
        bens.append("")
    out["benefits_list"] = bens[:3]

    if not legacy_ex and out["example_tasks"][0]:
        out["example_task"] = out["example_tasks"][0]
    elif legacy_ex:
        out["example_task"] = legacy_ex
    if not legacy_ben and any(out["benefits_list"]):
        out["benefits"] = " ".join(x for x in out["benefits_list"] if x)
    elif legacy_ben:
        out["benefits"] = legacy_ben
    return out


def generate_challenge_for_mood(
    mindsets_payload: dict[str, Any],
    mood: str,
    avoid_titles: list[str],
) -> dict[str, Any]:
    from .prompts import CHALLENGE_SYSTEM

    avoid = "\n".join(f"- {t}" for t in avoid_titles[:40]) if avoid_titles else "(none)"
    user = json.dumps(
        {
            "user_mood": mood.strip(),
            "stored_mindsets": mindsets_payload,
            "recent_challenge_titles_to_avoid": avoid,
            "instruction": "Generate one new challenge. Must differ from the avoided titles.",
        },
        ensure_ascii=False,
    )
    return normalize_challenge_payload(chat_json(CHALLENGE_SYSTEM, user))


POINTS_BY_DIFFICULTY = {"easy": 5, "medium": 10, "hard": 15}


# Per 5-challenge chunk: caps worst-case latency; ~half the output of a 10-challenge call.
_DAILY_BATCH_CHUNK_MAX_TOKENS = 5500


def generate_daily_challenges_batch(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
) -> list[dict[str, Any]]:
    """Returns 10 challenge dicts with category, difficulty, points, and content fields.

    Uses two parallel API calls (5 challenges each) so wall-clock time is roughly max(t1, t2)
    instead of one very large completion.
    Retries once if merged titles are not unique across both parts.
    """
    from .prompts import DAILY_BATCH_SYSTEM_PART1, DAILY_BATCH_SYSTEM_PART2

    last_err: Exception | None = None
    for attempt in range(2):
        user = json.dumps(
            {
                "stored_mindsets": mindsets_payload,
                "titles_to_avoid": avoid_titles[:120],
            },
            ensure_ascii=False,
        )
        temp = 0.65 if attempt == 0 else 0.78

        def _fetch_part(system: str) -> dict[str, Any]:
            return chat_json(
                system,
                user,
                max_tokens=_DAILY_BATCH_CHUNK_MAX_TOKENS,
                temperature=temp,
            )

        try:
            with ThreadPoolExecutor(max_workers=2) as pool:
                fut1 = pool.submit(_fetch_part, DAILY_BATCH_SYSTEM_PART1)
                fut2 = pool.submit(_fetch_part, DAILY_BATCH_SYSTEM_PART2)
                data1 = fut1.result()
                data2 = fut2.result()

            part1 = data1.get("challenges") or []
            part2 = data2.get("challenges") or []
            if len(part1) != 5 or len(part2) != 5:
                raise ValueError(
                    f"Expected 5 challenges per parallel batch, got {len(part1)} and {len(part2)}"
                )
            challenges = list(part1) + list(part2)

            normalized: list[dict[str, Any]] = []
            for ch in challenges:
                diff = str(ch.get("difficulty") or "medium").lower().strip()
                if diff not in POINTS_BY_DIFFICULTY:
                    diff = "medium"
                ch = normalize_challenge_payload(dict(ch))
                ch["difficulty"] = diff
                ch["points"] = POINTS_BY_DIFFICULTY[diff]
                normalized.append(ch)
            _assert_unique_challenge_titles(normalized)
            return normalized
        except ValueError as e:
            last_err = e
            if "Duplicate" in str(e) and attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Daily batch generation failed")


_DAILY_CATEGORY_MOODS_MAX_TOKENS = 5500

# Fixed order for 3 challenges per category: one per mood, slot 1 only (no sad).
_MOOD_SLOT_ORDER: list[tuple[str, int]] = [
    ("energetic", 1),
    ("happy", 1),
    ("tired", 1),
]


def generate_daily_category_moods_batch(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
    category: str,
    *,
    personalization: str = "",
) -> list[dict[str, Any]]:
    """Returns 3 challenge dicts for one category: one per mood (energetic, happy, tired), slot 1."""
    from .prompts import daily_category_moods_system_prompt

    cat = (category or "").lower().strip()
    if cat not in _VALID_PAIR_CATEGORIES:
        raise ValueError("Invalid category")

    system = daily_category_moods_system_prompt(cat)
    user_payload: dict[str, Any] = {
        "stored_mindsets": mindsets_payload,
        "titles_to_avoid": avoid_titles[:200],
    }
    if (personalization or "").strip():
        user_payload["user_personalization"] = (personalization or "").strip()[:2500]
    user = json.dumps(
        user_payload,
        ensure_ascii=False,
    )

    last_err: Exception | None = None
    for attempt in range(2):
        temp = 0.65 if attempt == 0 else 0.78
        try:
            data = chat_json(system, user, max_tokens=_DAILY_CATEGORY_MOODS_MAX_TOKENS, temperature=temp)
            challenges = data.get("challenges") or []
            if len(challenges) != 3:
                raise ValueError(f"Expected 3 challenges for category {cat}, got {len(challenges)}")

            normalized: list[dict[str, Any]] = []
            for i, ch in enumerate(challenges):
                if not isinstance(ch, dict):
                    raise ValueError("Invalid challenge item")
                exp_mood, exp_slot = _MOOD_SLOT_ORDER[i]
                diff = str(ch.get("difficulty") or "medium").lower().strip()
                if diff not in POINTS_BY_DIFFICULTY:
                    diff = "medium"
                ch = normalize_challenge_payload(dict(ch))
                ch["difficulty"] = diff
                ch["points"] = POINTS_BY_DIFFICULTY[diff]
                ch["category"] = cat
                ch["mood"] = exp_mood
                ch["slot"] = exp_slot
                sm = ch.get("suitable_moods")
                if not isinstance(sm, list) or not sm:
                    ch["suitable_moods"] = [exp_mood]
                else:
                    sm2 = [str(x).strip() for x in sm if str(x).strip()]
                    if not any(str(x).lower() == exp_mood for x in sm2):
                        ch["suitable_moods"] = [exp_mood] + sm2[:2]
                    else:
                        ch["suitable_moods"] = sm2[:4]
                normalized.append(ch)

            _assert_unique_challenge_titles(normalized)
            return normalized
        except ValueError as e:
            last_err = e
            if "Duplicate" in str(e) and attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Daily category moods batch failed")


_DAILY_ENERGETIC_ONE_MAX_TOKENS = 2200
_DAILY_HAPPY_TIRED_PAIR_MAX_TOKENS = 3800


def generate_daily_category_energetic_one(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
    category: str,
    *,
    personalization: str = "",
) -> list[dict[str, Any]]:
    """Returns exactly one challenge dict: energetic, slot 1 (fast first paint per category)."""
    from .prompts import daily_category_energetic_one_system_prompt

    cat = (category or "").lower().strip()
    if cat not in _VALID_PAIR_CATEGORIES:
        raise ValueError("Invalid category")

    system = daily_category_energetic_one_system_prompt(cat)
    user_payload: dict[str, Any] = {
        "stored_mindsets": mindsets_payload,
        "titles_to_avoid": avoid_titles[:200],
    }
    if (personalization or "").strip():
        user_payload["user_personalization"] = (personalization or "").strip()[:2500]
    user = json.dumps(user_payload, ensure_ascii=False)

    last_err: Exception | None = None
    for attempt in range(2):
        temp = 0.65 if attempt == 0 else 0.78
        try:
            data = chat_json(system, user, max_tokens=_DAILY_ENERGETIC_ONE_MAX_TOKENS, temperature=temp)
            challenges = data.get("challenges") or []
            if len(challenges) != 1:
                raise ValueError(f"Expected 1 energetic challenge for category {cat}, got {len(challenges)}")
            ch = challenges[0]
            if not isinstance(ch, dict):
                raise ValueError("Invalid challenge item")
            diff = str(ch.get("difficulty") or "medium").lower().strip()
            if diff not in POINTS_BY_DIFFICULTY:
                diff = "medium"
            ch = normalize_challenge_payload(dict(ch))
            ch["difficulty"] = diff
            ch["points"] = POINTS_BY_DIFFICULTY[diff]
            ch["category"] = cat
            ch["mood"] = "energetic"
            ch["slot"] = 1
            sm = ch.get("suitable_moods")
            if not isinstance(sm, list) or not sm:
                ch["suitable_moods"] = ["energetic"]
            else:
                sm2 = [str(x).strip() for x in sm if str(x).strip()]
                if not any(str(x).lower() == "energetic" for x in sm2):
                    ch["suitable_moods"] = ["energetic"] + sm2[:2]
                else:
                    ch["suitable_moods"] = sm2[:4]
            _assert_unique_challenge_titles([ch])
            return [ch]
        except ValueError as e:
            last_err = e
            if "Duplicate" in str(e) and attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Daily category energetic-one batch failed")


_HAPPY_TIRED_ORDER: list[tuple[str, int]] = [("happy", 1), ("tired", 1)]


def generate_daily_category_happy_tired_pair(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
    category: str,
    *,
    personalization: str = "",
) -> list[dict[str, Any]]:
    """Returns two challenge dicts: happy then tired, slot 1 each."""
    from .prompts import daily_category_happy_tired_system_prompt

    cat = (category or "").lower().strip()
    if cat not in _VALID_PAIR_CATEGORIES:
        raise ValueError("Invalid category")

    system = daily_category_happy_tired_system_prompt(cat)
    user_payload: dict[str, Any] = {
        "stored_mindsets": mindsets_payload,
        "titles_to_avoid": avoid_titles[:200],
    }
    if (personalization or "").strip():
        user_payload["user_personalization"] = (personalization or "").strip()[:2500]
    user = json.dumps(user_payload, ensure_ascii=False)

    last_err: Exception | None = None
    for attempt in range(2):
        temp = 0.65 if attempt == 0 else 0.78
        try:
            data = chat_json(system, user, max_tokens=_DAILY_HAPPY_TIRED_PAIR_MAX_TOKENS, temperature=temp)
            challenges = data.get("challenges") or []
            if len(challenges) != 2:
                raise ValueError(f"Expected 2 happy/tired challenges for category {cat}, got {len(challenges)}")
            normalized: list[dict[str, Any]] = []
            for i, ch in enumerate(challenges):
                if not isinstance(ch, dict):
                    raise ValueError("Invalid challenge item")
                exp_mood, exp_slot = _HAPPY_TIRED_ORDER[i]
                diff = str(ch.get("difficulty") or "medium").lower().strip()
                if diff not in POINTS_BY_DIFFICULTY:
                    diff = "medium"
                ch = normalize_challenge_payload(dict(ch))
                ch["difficulty"] = diff
                ch["points"] = POINTS_BY_DIFFICULTY[diff]
                ch["category"] = cat
                ch["mood"] = exp_mood
                ch["slot"] = exp_slot
                sm = ch.get("suitable_moods")
                if not isinstance(sm, list) or not sm:
                    ch["suitable_moods"] = [exp_mood]
                else:
                    sm2 = [str(x).strip() for x in sm if str(x).strip()]
                    if not any(str(x).lower() == exp_mood for x in sm2):
                        ch["suitable_moods"] = [exp_mood] + sm2[:2]
                    else:
                        ch["suitable_moods"] = sm2[:4]
                normalized.append(ch)
            _assert_unique_challenge_titles(normalized)
            return normalized
        except ValueError as e:
            last_err = e
            if "Duplicate" in str(e) and attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Daily category happy/tired batch failed")


def validate_unique_challenge_titles(items: list[dict[str, Any]]) -> None:
    """Validate non-empty unique challenge_title values (e.g. after merging category batches)."""
    _assert_unique_challenge_titles(items)


def _assert_unique_challenge_titles(items: list[dict[str, Any]]) -> None:
    raw = [str(x.get("challenge_title") or "").strip().lower() for x in items]
    nonempty = [t for t in raw if t]
    if len(nonempty) != len(items):
        raise ValueError("Missing challenge title(s) in batch")
    if len(set(nonempty)) != len(nonempty):
        raise ValueError("Duplicate challenge titles in batch")


_VALID_PAIR_CATEGORIES = frozenset({"business", "money", "fitness", "power", "grooming"})


def generate_category_pair_batch(
    mindsets_payload: dict[str, Any],
    avoid_titles: list[str],
    category: str,
) -> list[dict[str, Any]]:
    """Returns exactly 2 challenge dicts for a single category (slots 1 and 2)."""
    from .prompts import CATEGORY_PAIR_SYSTEM

    cat = (category or "").lower().strip()
    if cat not in _VALID_PAIR_CATEGORIES:
        raise ValueError("Invalid category")
    system = CATEGORY_PAIR_SYSTEM.format(category=cat)
    last_err: Exception | None = None
    for attempt in range(2):
        user = json.dumps(
            {
                "stored_mindsets": mindsets_payload,
                "titles_to_avoid": avoid_titles[:120],
            },
            ensure_ascii=False,
        )
        temp = 0.65 if attempt == 0 else 0.78
        try:
            data = chat_json(system, user, max_tokens=3200, temperature=temp)
            challenges = data.get("challenges") or []
            if len(challenges) != 2:
                raise ValueError(f"Expected 2 challenges for category pair, got {len(challenges)}")

            normalized: list[dict[str, Any]] = []
            for i, ch in enumerate(challenges):
                diff = str(ch.get("difficulty") or "medium").lower().strip()
                if diff not in POINTS_BY_DIFFICULTY:
                    diff = "medium"
                ch = normalize_challenge_payload(dict(ch))
                ch["difficulty"] = diff
                ch["points"] = POINTS_BY_DIFFICULTY[diff]
                ch["category"] = cat
                ch["slot"] = i + 1
                normalized.append(ch)
            _assert_unique_challenge_titles(normalized)
            return normalized
        except ValueError as e:
            last_err = e
            if "Duplicate" in str(e) and attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Category pair generation failed")


def generate_mood_category_challenges_batch(
    mindsets_payload: dict[str, Any],
    mood: str,
    category: str,
    mood_behavior_instruction: str,
    avoid_titles: list[str],
    user_mindset_summary: str = "",
) -> list[dict[str, Any]]:
    """Returns exactly 2 dicts with keys title, description, mood, category."""
    from .prompts import MOOD_CATEGORY_SYSTEM

    mood = (mood or "").strip().lower()
    category = (category or "").strip().lower()
    system = MOOD_CATEGORY_SYSTEM.format(
        mood=mood,
        category=category,
        mood_behavior=mood_behavior_instruction,
    )
    avoid = "\n".join(f"- {t}" for t in avoid_titles[:40]) if avoid_titles else "(none)"
    hints = (user_mindset_summary or "").strip()[:900]
    user = json.dumps(
        {
            "stored_mindsets": mindsets_payload,
            "recent_challenge_titles_to_avoid": avoid,
            "user_mindset_hints": hints,
            "instruction": "If user_mindset_hints is non-empty, bias both challenges toward that user's themes and language while staying on mood and category.",
        },
        ensure_ascii=False,
    )
    data = chat_json(system, user, max_tokens=2200, temperature=0.72)
    challenges = data.get("challenges") or []
    if len(challenges) != 2:
        raise ValueError(f"Expected 2 challenges, got {len(challenges)}")
    out: list[dict[str, Any]] = []
    for ch in challenges:
        if not isinstance(ch, dict):
            raise ValueError("Invalid challenge item")
        out.append(
            {
                "title": str(ch.get("title") or "").strip(),
                "description": str(ch.get("description") or "").strip(),
                "mood": str(ch.get("mood") or "").strip().lower(),
                "category": str(ch.get("category") or "").strip().lower(),
            }
        )
    return out


def _pad_user_custom_description(user_title: str, existing: str) -> str:
    """Ensure a long enough description when the model returns too little text."""
    base = (existing or "").strip()
    filler = (
        f"This mission starts from your own idea: «{user_title}». "
        "Clarify the smallest version you can execute today, schedule it, run it once without perfectionism, "
        "and note one honest lesson before you close the loop. When attention drifts, pause for sixty seconds, "
        "then return to the single next action you already chose."
    )
    if len(base) >= 40:
        return base
    return f"{base}\n\n{filler}".strip() if base else filler


def _user_custom_output_grounds_title(
    title: str, description: str, example_tasks: list[str], benefits_list: list[str]
) -> bool:
    """True if description + examples + benefits clearly reference the user's title."""
    t = (title or "").strip().lower()
    if len(t) < 3:
        return False
    blob = f"{description} {' '.join(example_tasks)} {' '.join(benefits_list)}".lower()
    if t in blob:
        return True
    tokens = re.findall(r"[a-z0-9]+", t)
    significant = [x for x in tokens if len(x) >= 3]
    if not significant:
        collapsed_t = re.sub(r"\s+", "", t)
        collapsed_b = re.sub(r"\s+", "", blob)
        return bool(collapsed_t) and collapsed_t in collapsed_b
    return all(x in blob for x in significant)


def _force_title_grounding_on_user_custom(
    title: str, description: str, example_tasks: list[str], benefits_list: list[str]
) -> tuple[str, list[str], list[str]]:
    """Ensure copy visibly ties to the user's title when the model drifted to generic themes."""
    t = (title or "").strip()
    if not t:
        return description, list(example_tasks), list(benefits_list)
    mark = f"«{t}»"
    desc = (description or "").strip()
    tasks = [str(x).strip() for x in (example_tasks or [])]
    while len(tasks) < 3:
        tasks.append("")
    tasks = tasks[:3]
    bens = [str(x).strip() for x in (benefits_list or [])]
    while len(bens) < 3:
        bens.append("")
    bens = bens[:3]

    lead = f"Everything below is about the mission you named {mark}. Use that as the only topic.\n\n"
    desc = lead + desc
    tasks = [
        (f"Concrete step for {mark}: {x}" if x and t.lower() not in x.lower() else x) for x in tasks
    ]
    bens = [
        (f"Aligned with {mark}: {x[0].lower()}{x[1:]}" if x and t.lower() not in x.lower() else x)
        for x in bens
    ]
    return desc, tasks, bens


def enrich_user_custom_challenge_payload(
    mindsets_payload: dict[str, Any],
    title: str,
    difficulty: str,
    user_mindset_summary: str,
) -> dict[str, Any]:
    """Expand user title + difficulty into full challenge fields (title preserved exactly)."""
    from .prompts import USER_CUSTOM_CHALLENGE_EXPAND_SYSTEM

    t = (title or "").strip()
    if len(t) < 3:
        raise ValueError("Title too short")
    diff = (difficulty or "medium").lower().strip()
    if diff not in ("easy", "medium", "hard"):
        diff = "medium"

    fix_note = ""
    data: dict[str, Any] | None = None

    for gen_pass in range(2):
        payload: dict[str, Any] = {
            "stored_mindsets": mindsets_payload,
            "user_title": t,
            "chosen_difficulty": diff,
            "existing_user_mindset_summary": (user_mindset_summary or "").strip(),
        }
        if fix_note:
            payload["fix_previous_attempt"] = fix_note
        user = json.dumps(payload, ensure_ascii=False)

        data = None
        for parse_attempt in range(2):
            try:
                temp = 0.52 if gen_pass == 0 else 0.38
                data = chat_json(
                    USER_CUSTOM_CHALLENGE_EXPAND_SYSTEM,
                    user,
                    max_tokens=1800,
                    temperature=temp,
                )
                break
            except (json.JSONDecodeError, TypeError, ValueError) as e:
                if parse_attempt == 1:
                    raise RuntimeError(f"Invalid model response for custom task: {e}") from e
            except Exception:
                if parse_attempt == 1:
                    raise
        assert data is not None

        desc = _pad_user_custom_description(t, str(data.get("challenge_description") or "").strip())
        merged: dict[str, Any] = {
            "challenge_title": t,
            "challenge_description": desc,
            "example_tasks": data.get("example_tasks"),
            "benefits_list": data.get("benefits_list"),
            "based_on_mindset": str(data.get("based_on_mindset") or "").strip(),
            "suitable_moods": data.get("suitable_moods"),
            "difficulty": diff,
            "category": "personal",
        }
        ch = normalize_challenge_payload(merged)
        ch["challenge_title"] = t
        ch["challenge_description"] = desc
        ch["difficulty"] = diff
        ch["category"] = "personal"
        tasks = ch.get("example_tasks") or ["", "", ""]
        bens = ch.get("benefits_list") or ["", "", ""]
        if _user_custom_output_grounds_title(t, desc, tasks, bens):
            break
        fix_note = (
            "Your last answer was off-topic. Regenerate the whole JSON. "
            "challenge_description, every example_tasks string, and every benefits_list string MUST include "
            "the exact user_title text (copy it verbatim at least once in each field). "
            "Do not write generic mindset or growth content unless user_title is literally about that."
        )

    assert data is not None
    desc = ch["challenge_description"]
    tasks = list(ch.get("example_tasks") or ["", "", ""])
    bens = list(ch.get("benefits_list") or ["", "", ""])
    if not _user_custom_output_grounds_title(t, desc, tasks, bens):
        desc, tasks, bens = _force_title_grounding_on_user_custom(t, desc, tasks, bens)
        ch["challenge_description"] = _pad_user_custom_description(t, desc)
        ch["example_tasks"] = tasks
        ch["benefits_list"] = bens
        ch = normalize_challenge_payload(ch)
        ch["challenge_title"] = t
        ch["difficulty"] = diff
        ch["category"] = "personal"

    sm = ch.get("suitable_moods")
    if not isinstance(sm, list) or not sm:
        ch["suitable_moods"] = ["custom", "energetic"]
    else:
        sm2 = [str(x).strip() for x in sm if str(x).strip()]
        if "custom" not in [x.lower() for x in sm2]:
            ch["suitable_moods"] = ["custom"] + sm2[:4]
        else:
            ch["suitable_moods"] = sm2[:6]
    return ch


def merge_user_device_mindset_summary(
    previous: str,
    title: str,
    difficulty: str,
    one_line_focus: str,
) -> str:
    """Update rolling device summary after a new user-created task."""
    from .prompts import USER_DEVICE_MINDSET_MERGE_SYSTEM

    user = json.dumps(
        {
            "previous_summary": (previous or "").strip(),
            "new_task": {
                "title": (title or "").strip(),
                "difficulty": (difficulty or "").strip(),
                "one_sentence_focus": (one_line_focus or "").strip(),
            },
        },
        ensure_ascii=False,
    )
    data = chat_json(USER_DEVICE_MINDSET_MERGE_SYSTEM, user, max_tokens=600, temperature=0.45)
    s = str(data.get("summary") or "").strip()
    if len(s) > 1200:
        s = s[:1197] + "..."
    return s


def _normalize_membership_paragraphs_dataset_grounded(paragraphs: list[str]) -> list[str]:
    """Keep AI paragraphs as-is; allow up to six lengthy sections."""
    cleaned = [str(x).strip() for x in paragraphs if str(x).strip()]
    if not cleaned:
        return [""]
    return cleaned[:6]


def _normalize_membership_article(
    raw: Any,
    *,
    keyword: str = "",
    category: str = "",
    dataset_title: str = "",
    dataset_description: str = "",
) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("Article response was not a JSON object")
    title = str(raw.get("title") or "").strip()
    if len(title) < 3:
        title = (dataset_title or keyword or "").strip()
    if len(title) < 3:
        raise ValueError("Title too short")
    description = str(raw.get("description") or "").strip()
    if not description:
        description = (dataset_description or "").strip()
    kp = raw.get("key_points")
    if not isinstance(kp, list):
        kp = []
    key_points = [str(x).strip() for x in kp if str(x).strip()][:6]

    paras = raw.get("paragraphs")
    if not isinstance(paras, list):
        paras = []
    paragraphs = _normalize_membership_paragraphs_dataset_grounded(
        [str(x).strip() for x in paras if str(x).strip()][:6],
    )
    return {
        "title": title[:500],
        "description": description[:900],
        "key_points": key_points,
        "paragraphs": paragraphs,
    }


def _normalize_extracted_keyword_rows(raw: Any) -> list[dict[str, str]]:
    from apps.membership.dataset_match import extract_row_article_source, row_has_substantive_source
    from apps.membership.keyword_dataset import normalize_category

    if not isinstance(raw, dict):
        raise ValueError("Keyword extraction response was not a JSON object")
    arr = raw.get("keywords")
    if not isinstance(arr, list):
        raise ValueError('Keyword extraction must include a "keywords" array')
    out: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for item in arr:
        if not isinstance(item, dict):
            continue
        kw = str(item.get("keyword") or item.get("phrase") or item.get("term") or "").strip()
        if len(kw) < 2:
            continue
        cat = normalize_category(str(item.get("category") or ""))
        dedupe = (cat, kw.lower()[:240])
        if dedupe in seen:
            continue
        seen.add(dedupe)
        row: dict[str, str] = {"category": cat, "keyword": kw[:500]}
        for field, keys in (
            ("title", ("title", "headline", "name")),
            ("description", ("description", "desc", "summary", "excerpt")),
            ("source_text", ("source_text", "source", "content", "body", "text")),
        ):
            val = ""
            for k in keys:
                v = item.get(k)
                if v is not None and str(v).strip():
                    val = str(v).strip()
                    break
            if val:
                cap = 8000 if field == "source_text" else (900 if field == "description" else 500)
                row[field] = val[:cap]
        enriched = extract_row_article_source(row)
        if not row_has_substantive_source(enriched):
            continue
        out.append(
            {
                "category": enriched["category"],
                "keyword": enriched["keyword"][:500],
                "title": enriched["title"][:500],
                "description": enriched["description"][:900],
                "source_text": enriched["source_text"][:8000],
            }
        )
    if len(out) < 3:
        raise ValueError("Too few distinct keywords extracted (need at least 3)")
    return out[:48]


def extract_membership_keywords_from_document(document_text: str, *, creative_seed: str = "") -> list[dict[str, str]]:
    """
    Turn raw document text into {category, keyword} rows for ArticleKeywordDataset.rows.
    """
    from .prompts import MEMBERSHIP_KEYWORD_EXTRACTION_SYSTEM

    text = (document_text or "").strip()
    if len(text) < 80:
        raise ValueError("Document text too short for keyword extraction")
    cap = 18_000
    if len(text) > cap:
        text = text[:cap] + "\n\n[... document truncated for processing ...]"

    payload = {
        "document_text": text,
        "creative_seed": (creative_seed or "").strip()[:64],
    }
    user = "Extract article seed keywords from this document (JSON input):\n" + json.dumps(
        payload, ensure_ascii=False
    )
    data = chat_json(
        MEMBERSHIP_KEYWORD_EXTRACTION_SYSTEM,
        user,
        max_tokens=5200,
        temperature=0.35,
    )
    return _normalize_extracted_keyword_rows(data)


def _normalize_extracted_keyword_rows(raw: Any) -> list[dict[str, str]]:
    from apps.membership.dataset_match import extract_row_article_source, row_has_substantive_source
    from apps.membership.keyword_dataset import normalize_category

    if not isinstance(raw, dict):
        raise ValueError("Keyword extraction response was not a JSON object")
    arr = raw.get("keywords")
    if not isinstance(arr, list):
        raise ValueError('Keyword extraction must include a "keywords" array')
    out: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for item in arr:
        if not isinstance(item, dict):
            continue
        kw = str(item.get("keyword") or item.get("phrase") or item.get("term") or "").strip()
        if len(kw) < 2:
            continue
        cat = normalize_category(str(item.get("category") or ""))
        dedupe = (cat, kw.lower()[:240])
        if dedupe in seen:
            continue
        seen.add(dedupe)
        row: dict[str, str] = {"category": cat, "keyword": kw[:500]}
        for field, keys in (
            ("title", ("title", "headline", "name")),
            ("description", ("description", "desc", "summary", "excerpt")),
            ("source_text", ("source_text", "source", "content", "body", "text")),
        ):
            val = ""
            for k in keys:
                v = item.get(k)
                if v is not None and str(v).strip():
                    val = str(v).strip()
                    break
            if val:
                cap = 8000 if field == "source_text" else (900 if field == "description" else 500)
                row[field] = val[:cap]
        enriched = extract_row_article_source(row)
        if not row_has_substantive_source(enriched):
            continue
        out.append(
            {
                "category": enriched["category"],
                "keyword": enriched["keyword"][:500],
                "title": enriched["title"][:500],
                "description": enriched["description"][:900],
                "source_text": enriched["source_text"][:8000],
            }
        )
    if len(out) < 3:
        raise ValueError("Too few distinct keywords extracted (need at least 3)")
    return out[:48]


def extract_membership_keywords_from_document(document_text: str, *, creative_seed: str = "") -> list[dict[str, str]]:
    """
    Turn raw document text into {category, keyword} rows for ArticleKeywordDataset.rows.
    """
    from .prompts import MEMBERSHIP_KEYWORD_EXTRACTION_SYSTEM

    text = (document_text or "").strip()
    if len(text) < 80:
        raise ValueError("Document text too short for keyword extraction")
    cap = 18_000
    if len(text) > cap:
        text = text[:cap] + "\n\n[... document truncated for processing ...]"

    payload = {
        "document_text": text,
        "creative_seed": (creative_seed or "").strip()[:64],
    }
    user = "Extract article seed keywords from this document (JSON input):\n" + json.dumps(
        payload, ensure_ascii=False
    )
    data = chat_json(
        MEMBERSHIP_KEYWORD_EXTRACTION_SYSTEM,
        user,
        max_tokens=5200,
        temperature=0.35,
    )
    return _normalize_extracted_keyword_rows(data)


def generate_membership_article(
    *,
    keyword: str,
    category: str,
    dataset_title: str = "",
    dataset_description: str = "",
    source_text: str = "",
    course_title_line: str = "",
    avoid_titles: list[str] | None = None,
    avoid_keywords: list[str] | None = None,
    creative_seed: str = "",
) -> dict[str, Any]:
    """JSON article for membership hub: title, description, key_points, paragraphs — grounded in dataset row."""
    from .prompts import MEMBERSHIP_ARTICLE_SYSTEM

    avoid = "\n".join(f"- {t}" for t in (avoid_titles or [])[:30] if str(t).strip()) or "(none)"
    user = json.dumps(
        {
            "keyword": (keyword or "").strip()[:400],
            "category": (category or "others").strip().lower()[:32],
            "dataset_title": (dataset_title or keyword or "").strip()[:500],
            "dataset_description": (dataset_description or "").strip()[:900],
            "source_text": (source_text or dataset_description or keyword or "").strip()[:8000],
            "course_title_line": (course_title_line or dataset_title or "").strip()[:500],
            "writing_goal": (
                "Lengthy membership article grounded in source_text: same course section as "
                "course_title_line and dataset_title. Title from the most informative source line, "
                "4-6 sentence course summary as description, 5-6 key points, 4-6 paragraphs "
                "covering the full source_text in simple English."
            ),
            "titles_to_avoid": avoid,
            "creative_seed": (creative_seed or "").strip()[:64],
        },
        ensure_ascii=False,
    )
    last_err: Exception | None = None
    for attempt in range(2):
        temp = 0.4 if attempt == 0 else 0.5
        try:
            data = chat_json(MEMBERSHIP_ARTICLE_SYSTEM, user, max_tokens=5200, temperature=temp)
            return _normalize_membership_article(
                data,
                keyword=keyword,
                category=category,
                dataset_title=dataset_title or keyword,
                dataset_description=dataset_description,
            )
        except (ValueError, TypeError, KeyError, json.JSONDecodeError) as e:
            last_err = e
            if attempt == 0:
                continue
            raise
    raise last_err or RuntimeError("Membership article generation failed")


def generate_agent_daily_quote(
    mindsets_payload: dict[str, Any],
    avoid_quotes: list[str],
    calendar_date_iso: str,
    *,
    operator_id: int | None = None,
    personalization: str = "",
    creative_seed: str = "",
) -> str:
    """Single JSON quote line for the Syndicate dashboard; avoids past / other users' lines."""
    from .prompts import AGENT_QUOTE_SYSTEM

    user = json.dumps(
        {
            "stored_mindsets": mindsets_payload,
            "quotes_to_avoid": avoid_quotes[:100],
            "calendar_date": calendar_date_iso,
            "operator_id": operator_id,
            "personalization": (personalization or "").strip()[:2000],
            "creative_seed": (creative_seed or "").strip()[:64],
        },
        ensure_ascii=False,
    )
    data = chat_json(AGENT_QUOTE_SYSTEM, user, max_tokens=260, temperature=0.92)
    q = str(data.get("quote") or "").strip()
    if len(q) < 12:
        raise ValueError("Agent quote too short")
    return q
