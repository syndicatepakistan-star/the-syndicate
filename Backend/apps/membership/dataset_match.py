"""Match article seeds to ArticleKeywordDataset.rows (exact + normalized search)."""

from __future__ import annotations

import re
from typing import Any

from apps.membership.generation import keyword_fingerprint
from apps.membership.keyword_dataset import VALID_CATEGORIES, normalize_category

_APOSTROPHE_RE = re.compile(r"[\u2018\u2019\u201b'`´]")


def normalize_search_text(text: str) -> str:
    """Lowercase, unify apostrophes, collapse spaces, strip trailing punctuation for search."""
    s = (text or "").strip().lower()
    s = _APOSTROPHE_RE.sub("'", s)
    s = re.sub(r"\s+", " ", s)
    s = s.strip(' "\'')
    s = re.sub(r"[.,;:!?]+$", "", s)
    return s


def _row_field(row: dict[str, Any], *keys: str) -> str:
    """Read the first non-empty string value from row (case-insensitive keys)."""
    norm = {(k or "").strip().lower(): v for k, v in row.items() if isinstance(k, str)}
    for key in keys:
        raw = row.get(key)
        if raw is None:
            raw = norm.get(key.lower())
        if raw is not None and str(raw).strip():
            return str(raw).strip()
    return ""


MIN_SOURCE_TEXT_CHARS = 250
MIN_SOURCE_WORD_COUNT = 50
TARGET_SOURCE_WORD_COUNT = 120


def text_is_mostly_keyword(text: str, keyword: str) -> bool:
    """True when text is essentially the same short phrase as the keyword seed."""
    a = normalize_search_text(text)
    b = normalize_search_text(keyword)
    if not a or not b:
        return False
    if a == b:
        return True
    shorter, longer = (a, b) if len(a) <= len(b) else (b, a)
    if shorter in longer and len(longer) - len(shorter) < 24:
        return True
    return len(a.split()) <= 6 and len(b.split()) <= 6 and a == b


def row_has_substantive_source(source: dict[str, str]) -> bool:
    """Row has enough distinct dataset text to write a real article (not keyword-only)."""
    keyword = (source.get("keyword") or "").strip()
    source_text = (source.get("source_text") or "").strip()
    description = (source.get("description") or "").strip()
    title = (source.get("title") or "").strip()

    if len(source_text) >= MIN_SOURCE_TEXT_CHARS and len(source_text.split()) >= MIN_SOURCE_WORD_COUNT:
        if not text_is_mostly_keyword(source_text, keyword):
            return True

    if (
        len(description) >= 80
        and not text_is_mostly_keyword(description, keyword)
        and description.lower() != title.lower()
    ):
        return True

    return (
        len(title) >= 24
        and not text_is_mostly_keyword(title, keyword)
        and title.lower() != keyword.lower()
    )


def _sentence_list(text: str, *, min_len: int = 12) -> list[str]:
    return [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+", (text or "").strip())
        if len(s.strip()) >= min_len
    ]


def _word_overlap_ratio(a: str, b: str) -> float:
    wa = set(normalize_search_text(a).split())
    wb = set(normalize_search_text(b).split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / min(len(wa), len(wb))


def _merge_course_text_blocks(blocks: list[str]) -> str:
    """Join course blocks; drop duplicates and blocks fully contained in another."""
    out: list[str] = []
    norms: list[str] = []
    for block in blocks:
        text = (block or "").strip()
        if not text:
            continue
        norm = normalize_search_text(text)
        if not norm:
            continue
        if any(norm == existing for existing in norms):
            continue
        if any(norm in existing or existing in norm for existing in norms if len(existing) > 24):
            continue
        out.append(text)
        norms.append(norm)
    return "\n\n".join(out)


def align_source_with_title_line(source_text: str, title_line: str) -> str:
    """Put the course section containing the title line first so the article stays on-topic."""
    text = (source_text or "").strip()
    headline = (title_line or "").strip()
    if not text or not headline:
        return text
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if len(paragraphs) > 1:
        headline_norm = normalize_search_text(headline)
        scored: list[tuple[float, int, str]] = []
        for idx, para in enumerate(paragraphs):
            para_norm = normalize_search_text(para)
            score = 0.0
            if headline_norm in para_norm or para_norm in headline_norm:
                score += 3.0
            score += _word_overlap_ratio(headline, para) * 2.0
            if headline.lower() in para.lower():
                score += 1.0
            scored.append((score, idx, para))
        scored.sort(key=lambda x: (-x[0], x[1]))
        if scored[0][0] > 0:
            best_idx = scored[0][1]
            if best_idx > 0:
                ordered = paragraphs[best_idx:] + paragraphs[:best_idx]
                return "\n\n".join(ordered)
        return text
    sentences = _sentence_list(text, min_len=8)
    if len(sentences) <= 1:
        return text
    headline_norm = normalize_search_text(headline)
    pivot = 0
    best_score = -1.0
    for idx, sentence in enumerate(sentences):
        sentence_norm = normalize_search_text(sentence)
        score = 0.0
        if headline_norm in sentence_norm or sentence_norm in headline_norm:
            score += 3.0
        score += _word_overlap_ratio(headline, sentence) * 2.0
        if score > best_score:
            best_score = score
            pivot = idx
    if pivot == 0 or best_score <= 0:
        return text
    reordered = sentences[pivot:] + sentences[:pivot]
    return " ".join(reordered)


def build_course_source_text(
    *,
    keyword: str = "",
    title: str = "",
    description: str = "",
    raw_source: str = "",
) -> str:
    """
    Build lengthy source_text from one course row: same section as the title,
    informative, and grounded in the uploaded dataset (no invented text).
    """
    content = (raw_source or "").strip()
    course_title = (title or "").strip()
    course_description = (description or "").strip()
    blocks: list[str] = []

    if content and not text_is_mostly_keyword(content, keyword):
        blocks.append(content)

    if course_title and not text_is_mostly_keyword(course_title, keyword):
        title_norm = normalize_search_text(course_title)
        content_norm = normalize_search_text(content)
        if not content or title_norm not in content_norm:
            blocks.insert(0, course_title)

    if course_description and not text_is_mostly_keyword(course_description, keyword):
        desc_norm = normalize_search_text(course_description)
        content_norm = normalize_search_text(content)
        title_norm = normalize_search_text(course_title)
        if desc_norm not in content_norm and desc_norm != title_norm:
            if content and len(content.split()) >= TARGET_SOURCE_WORD_COUNT:
                blocks.append(course_description)
            else:
                blocks.insert(1 if blocks else 0, course_description)

    merged = _merge_course_text_blocks(blocks)
    if not merged or text_is_mostly_keyword(merged, keyword):
        merged = content or course_description or course_title or (keyword or "").strip()
    return merged


def pick_informative_title_line(source_text: str, keyword: str = "", dataset_title: str = "") -> str:
    """Choose the most informative line from source material for use as article title."""
    if dataset_title and not text_is_mostly_keyword(dataset_title, keyword) and len(dataset_title) >= 24:
        return dataset_title[:500]
    sentences = _sentence_list(source_text, min_len=20)
    if not sentences:
        return (dataset_title or keyword)[:500]
    scored: list[tuple[int, str]] = []
    for s in sentences:
        if text_is_mostly_keyword(s, keyword):
            continue
        words = len(s.split())
        length_score = 3 if 40 <= len(s) <= 140 else (1 if 24 <= len(s) <= 180 else 0)
        word_score = min(4, words // 6)
        scored.append((length_score + word_score, s))
    if scored:
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1][:500]
    return sentences[0][:500]


def source_text_to_summary_description(text: str, *, max_chars: int = 900) -> str:
    """Build a multi-sentence course summary from source sentences only."""
    sentences = _sentence_list(text, min_len=24)
    if not sentences:
        chunk = (text or "").strip()
        return chunk[:max_chars] if chunk else ""
    parts: list[str] = []
    total = 0
    for s in sentences[:6]:
        candidate = s if re.search(r"[.!?]$", s) else f"{s}."
        if total + len(candidate) + 1 > max_chars and parts:
            break
        parts.append(candidate)
        total += len(candidate) + 1
        if len(parts) >= 4 and total >= 280:
            break
    return " ".join(parts)[:max_chars]


def source_text_to_key_points(text: str, *, max_points: int = 6) -> list[str]:
    sentences = _sentence_list(text, min_len=24)
    out: list[str] = []
    for s in sentences[: max(1, max_points)]:
        out.append(s if re.search(r"[.!?]$", s) else f"{s}.")
    return out


def source_text_to_paragraphs(text: str, *, max_paras: int = 6) -> list[str]:
    sentences = _sentence_list(text, min_len=12)
    if not sentences:
        chunk = (text or "").strip()
        return [chunk] if chunk else []
    if len(sentences) <= max_paras:
        return [s if re.search(r"[.!?]$", s) else f"{s}." for s in sentences]
    chunk_size = max(2, (len(sentences) + max_paras - 1) // max_paras)
    paras: list[str] = []
    for i in range(0, len(sentences), chunk_size):
        group = sentences[i : i + chunk_size]
        part = " ".join(group).strip()
        if part:
            paras.append(part if re.search(r"[.!?]$", part) else f"{part}.")
        if len(paras) >= max_paras:
            break
    return paras[:max_paras]


def sanitize_article_body_from_source(body: dict[str, Any], row_source: dict[str, str]) -> dict[str, Any]:
    """Ensure title, description, key_points, and paragraphs are distinct, sourced, and sufficiently long."""
    keyword = (row_source.get("keyword") or "").strip()
    source_text = (row_source.get("source_text") or "").strip()
    dataset_title = (row_source.get("title") or keyword).strip()
    dataset_description = (row_source.get("description") or "").strip()

    title = str(body.get("title") or "").strip()
    course_title_line = (row_source.get("course_title_line") or "").strip()
    if not title or text_is_mostly_keyword(title, keyword):
        title = course_title_line or pick_informative_title_line(
            source_text, keyword=keyword, dataset_title=dataset_title
        )
    title = title[:500]

    description = str(body.get("description") or "").strip()
    if not description or text_is_mostly_keyword(description, keyword) or len(description.split()) < 35:
        if dataset_description and len(dataset_description.split()) >= 20 and not text_is_mostly_keyword(
            dataset_description, keyword
        ):
            description = dataset_description
        else:
            description = source_text_to_summary_description(source_text)
    description = description[:900]

    key_points_raw = body.get("key_points")
    key_points = [str(x).strip() for x in key_points_raw if str(x).strip()] if isinstance(key_points_raw, list) else []
    unique_kps: list[str] = []
    seen_kp: set[str] = set()
    for kp in key_points:
        low = normalize_search_text(kp)
        if low in seen_kp or text_is_mostly_keyword(kp, keyword):
            continue
        seen_kp.add(low)
        unique_kps.append(kp)
    if len(unique_kps) < 4 and source_text:
        unique_kps = source_text_to_key_points(source_text, max_points=6)

    paras_raw = body.get("paragraphs")
    paragraphs = [str(x).strip() for x in paras_raw if str(x).strip()] if isinstance(paras_raw, list) else []
    unique_paras: list[str] = []
    seen_p: set[str] = set()
    total_words = 0
    for p in paragraphs:
        low = normalize_search_text(p)
        if low in seen_p or text_is_mostly_keyword(p, keyword):
            continue
        seen_p.add(low)
        unique_paras.append(p)
        total_words += len(p.split())
    if len(unique_paras) < 3 or total_words < 180:
        if source_text:
            unique_paras = source_text_to_paragraphs(source_text, max_paras=6)

    return {
        "title": title,
        "description": description,
        "key_points": unique_kps[:6],
        "paragraphs": unique_paras[:6],
    }


def extract_row_article_source(row: dict[str, Any]) -> dict[str, str]:
    """
    Title, description, and body text for one dataset row.
    Falls back to keyword when dedicated columns are missing (legacy CSV rows).
    """
    keyword, category = split_row_keyword_category(row)
    title = _row_field(row, "title", "headline", "name") or keyword
    description = _row_field(
        row,
        "description",
        "desc",
        "summary",
        "excerpt",
        "subtitle",
        "blurb",
    )
    raw_source = _row_field(
        row,
        "source_text",
        "source",
        "content",
        "body",
        "text",
        "article",
        "details",
        "notes",
        "passage",
    )
    source_text = build_course_source_text(
        keyword=keyword,
        title=title,
        description=description,
        raw_source=raw_source,
    )
    if not description:
        description = source_text_to_summary_description(source_text) or source_text[:400] or keyword
    course_title_line = pick_informative_title_line(source_text, keyword=keyword, dataset_title=title)
    source_text = align_source_with_title_line(source_text, course_title_line)
    return {
        "keyword": keyword,
        "category": category,
        "title": title[:500],
        "description": description[:900],
        "source_text": source_text[:8000],
        "course_title_line": course_title_line[:500],
    }


def split_row_keyword_category(row: dict[str, Any]) -> tuple[str, str]:
    """Normalize keyword/category from a dataset row (fixes 'keyword - others' stuck in keyword)."""
    cat = normalize_category(str(row.get("category") or ""))
    kw = str(row.get("keyword") or "").strip()
    if not kw:
        return "", cat
    if cat:
        suffix = f" - {cat}"
        if kw.lower().endswith(suffix):
            kw = kw[: -len(suffix)].strip()
    if " - " in kw:
        left, right = kw.rsplit(" - ", 1)
        maybe_cat = normalize_category(right.strip())
        if maybe_cat in VALID_CATEGORIES and left.strip():
            return left.strip(), maybe_cat
    return kw, cat


def clean_stored_seed_keyword(keyword: str, category: str = "") -> str:
    """Fix articles where generation_seed_keyword accidentally includes ' - category'."""
    kw = (keyword or "").strip()
    cat = normalize_category(category) if category else ""
    if kw and cat:
        suffix = f" - {cat}"
        if kw.lower().endswith(suffix):
            kw = kw[: -len(suffix)].strip()
    return kw


def parse_seed_line(line: str) -> tuple[str, str] | None:
    """Parse 'Seed: keyword - category' from article content."""
    line = (line or "").strip()
    if not line.lower().startswith("seed:"):
        return None
    rest = line[5:].strip()
    if " - " not in rest:
        kw = rest.strip()
        return (kw, "") if kw else None
    kw_part, cat_part = rest.rsplit(" - ", 1)
    kw = kw_part.strip()
    if not kw:
        return None
    return kw, normalize_category(cat_part.strip())


def find_row_for_keyword(
    keyword: str,
    rows: list[dict[str, Any]],
    *,
    category: str = "",
) -> tuple[int, dict[str, Any]] | None:
    """Return (1-based line number, row dict) or None."""
    if not keyword or not rows:
        return None
    nk = normalize_search_text(clean_stored_seed_keyword(keyword, category))
    cat_norm = normalize_category(category) if category else ""
    for index, r in enumerate(rows, start=1):
        if not isinstance(r, dict):
            continue
        row_kw, row_cat = split_row_keyword_category(r)
        if not row_kw:
            continue
        rk = normalize_search_text(row_kw)
        if nk == rk or nk in rk or rk in nk:
            if not cat_norm or not row_cat or cat_norm == row_cat:
                return index, r
    return None


def article_seed_keyword(article) -> str:
    kw = clean_stored_seed_keyword(
        getattr(article, "generation_seed_keyword", None) or "",
        getattr(article, "generation_seed_category", None) or "",
    )
    if kw:
        return kw
    for line in (getattr(article, "content", None) or "").split("\n")[:12]:
        parsed = parse_seed_line(line)
        if parsed:
            return parsed[0]
    return ""


def seed_matches_dataset(article, dataset) -> bool:
    rows = dataset.rows if isinstance(getattr(dataset, "rows", None), list) else []
    if not rows:
        return False
    kw = article_seed_keyword(article)
    if not kw:
        return False
    cat = (getattr(article, "generation_seed_category", None) or "").strip()
    return find_row_for_keyword(kw, rows, category=cat) is not None


def describe_seed_in_dataset(article, dataset) -> str:
    rows = dataset.rows if isinstance(getattr(dataset, "rows", None), list) else []
    kw = article_seed_keyword(article)
    if not kw:
        return "No dataset seed on this article."
    cat = (getattr(article, "generation_seed_category", None) or "").strip()
    hit = find_row_for_keyword(kw, rows, category=cat)
    if hit:
        line_no, row = hit
        row_kw, _ = split_row_keyword_category(row)
        return f"Found at line {line_no} in dataset: «{row_kw[:120]}»"
    return (
        f"Not found in this dataset’s {len(rows)} rows (search: «{kw[:120]}»). "
        "The dataset may have been re-uploaded after this article was created."
    )


# Rendering 2000+ lines in Django admin can OOM small Railway containers.
MAX_KEYWORDS_ADMIN_DISPLAY = 80


def format_all_keywords_for_search(rows: list[dict[str, Any]], *, limit: int = MAX_KEYWORDS_ADMIN_DISPLAY) -> str:
    lines: list[str] = []
    total = 0
    for r in rows:
        if isinstance(r, dict) and str(r.get("keyword") or "").strip():
            total += 1
    show = min(total, max(1, int(limit)))
    shown = 0
    for i, r in enumerate(rows, start=1):
        if not isinstance(r, dict):
            continue
        kw, cat = split_row_keyword_category(r)
        if not kw:
            continue
        if shown >= show:
            break
        lines.append(f"{i}. [{cat}] {kw}" + (f" — {r.get('title')}" if str(r.get("title") or "").strip() else ""))
        shown += 1
    if not lines:
        return "(no keywords parsed — upload file and Save)"
    header = f"Showing {shown} of {total} keywords (admin preview cap; articles still use the full dataset).\n\n"
    if total > shown:
        header += f"Use Ctrl+F within these lines, or export your CSV. Full count: {total}.\n\n"
    return header + "\n".join(lines)
