"""Match article seeds to ArticleKeywordDataset.rows (exact + normalized search)."""

from __future__ import annotations

import re
from typing import Any

from apps.membership.generation import keyword_fingerprint
from apps.membership.keyword_dataset import normalize_category


def normalize_search_text(text: str) -> str:
    s = (text or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s.strip(' "\'')


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
) -> dict[str, Any] | None:
    if not keyword or not rows:
        return None
    nk = normalize_search_text(keyword)
    cat_norm = normalize_category(category) if category else ""
    for r in rows:
        if not isinstance(r, dict):
            continue
        row_kw = str(r.get("keyword") or "").strip()
        if not row_kw:
            continue
        rk = normalize_search_text(row_kw)
        row_cat = normalize_category(str(r.get("category") or ""))
        if nk == rk or nk in rk or rk in nk:
            if not cat_norm or not row_cat or cat_norm == row_cat:
                return r
    return None


def article_seed_keyword(article) -> str:
    kw = (getattr(article, "generation_seed_keyword", None) or "").strip()
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


def format_all_keywords_for_search(rows: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for i, r in enumerate(rows, start=1):
        if not isinstance(r, dict):
            continue
        kw = str(r.get("keyword") or "").strip()
        if not kw:
            continue
        cat = normalize_category(str(r.get("category") or ""))
        lines.append(f"{i}. [{cat}] {kw}")
    return "\n".join(lines) if lines else "(no keywords parsed — upload file and Save)"
