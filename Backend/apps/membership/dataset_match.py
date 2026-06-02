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
        lines.append(f"{i}. [{cat}] {kw}")
        shown += 1
    if not lines:
        return "(no keywords parsed — upload file and Save)"
    header = f"Showing {shown} of {total} keywords (admin preview cap; articles still use the full dataset).\n\n"
    if total > shown:
        header += f"Use Ctrl+F within these lines, or export your CSV. Full count: {total}.\n\n"
    return header + "\n".join(lines)
