"""Weighted keyword selection, progression, and de-duplication for AI article generation."""

from __future__ import annotations

import hashlib
import random
from collections.abc import Iterable
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.membership.json_tags import filter_articles_with_tag
from apps.membership.keyword_dataset import normalize_category
from apps.membership.keyword_levels import LEVEL_ORDER, next_level_after, normalize_level
from apps.membership.models import Article, ArticleKeywordDataset, KeywordUsageStat, MembershipGenerationState


def keyword_fingerprint(category: str, keyword: str) -> str:
    cat = normalize_category(category or "")
    kw = (keyword or "").strip().lower()
    h = hashlib.sha256(f"{cat}|{kw}".encode("utf-8")).hexdigest()
    return h[:32]


def _parse_seed_from_content(content: str | None) -> tuple[str, str] | None:
    if not content:
        return None
    for line in content.split("\n")[:12]:
        line = line.strip()
        if line.lower().startswith("seed:"):
            rest = line[5:].strip()
            if " - " in rest:
                kw_part, cat_part = rest.rsplit(" - ", 1)
                kw = kw_part.strip()
                cat = normalize_category(cat_part.strip())
                if kw:
                    return kw, cat
    return None


def article_keyword_fingerprint(article: Article) -> str | None:
    if getattr(article, "generation_seed_keyword", None) and getattr(article, "generation_seed_category", None):
        return keyword_fingerprint(article.generation_seed_category, article.generation_seed_keyword)
    parsed = _parse_seed_from_content(article.content)
    if parsed:
        kw, cat = parsed
        return keyword_fingerprint(cat, kw)
    return None


def collect_dataset_used_fingerprints(dataset: ArticleKeywordDataset) -> set[str]:
    """Keyword fingerprints from articles currently linked to this dataset (not usage stats)."""
    out: set[str] = set()
    for kw, cat in (
        Article.objects.filter(generation_source_dataset=dataset)
        .exclude(generation_seed_keyword="")
        .values_list("generation_seed_keyword", "generation_seed_category")
    ):
        out.add(keyword_fingerprint(cat or "", kw))
    return out


def collect_dataset_avoid_titles(dataset: ArticleKeywordDataset, *, limit: int = 80) -> list[str]:
    titles: list[str] = []
    seen: set[str] = set()
    for title in (
        Article.objects.filter(generation_source_dataset=dataset)
        .exclude(title="")
        .order_by("-id")
        .values_list("title", flat=True)[: max(1, int(limit))]
    ):
        s = (title or "").strip()
        if not s:
            continue
        low = s.lower()
        if low in seen:
            continue
        seen.add(low)
        titles.append(s[:500])
    return titles


def collect_avoid_fingerprints(
    *,
    operator_brief_limit: int = 40,
    state_fps: list[str] | None = None,
    read_slugs: list[str] | None = None,
) -> set[str]:
    out: set[str] = set()
    if state_fps:
        out.update(str(x) for x in state_fps if x)
    qs = (
        filter_articles_with_tag(Article.objects.all(), "operator-brief")
        .order_by("-published_at", "-id")
        .only("id", "content", "generation_seed_keyword", "generation_seed_category")[:operator_brief_limit]
    )
    for a in qs:
        fp = article_keyword_fingerprint(a)
        if fp:
            out.add(fp)
    if read_slugs:
        for slug in read_slugs[:24]:
            slug = (slug or "").strip()
            if not slug:
                continue
            a = Article.objects.filter(slug=slug).only("content", "generation_seed_keyword", "generation_seed_category").first()
            if a:
                fp = article_keyword_fingerprint(a)
                if fp:
                    out.add(fp)
    return out


def collect_avoid_keyword_phrases(
    *,
    operator_brief_limit: int = 35,
    read_slugs: list[str] | None = None,
) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []

    def push(k: str) -> None:
        k = (k or "").strip()
        if not k:
            return
        low = k.lower()
        if low in seen:
            return
        seen.add(low)
        out.append(k[:400])

    qs = (
        filter_articles_with_tag(Article.objects.all(), "operator-brief")
        .order_by("-published_at", "-id")
        .only("content", "generation_seed_keyword", "generation_seed_category")[:operator_brief_limit]
    )
    for a in qs:
        if getattr(a, "generation_seed_keyword", None):
            push(a.generation_seed_keyword)
        else:
            p = _parse_seed_from_content(a.content)
            if p:
                push(p[0])
        if len(out) >= 40:
            break
    if read_slugs:
        for slug in read_slugs[:24]:
            slug = (slug or "").strip()
            if not slug:
                continue
            a = Article.objects.filter(slug=slug).only("content", "generation_seed_keyword", "generation_seed_category").first()
            if a:
                if getattr(a, "generation_seed_keyword", None):
                    push(a.generation_seed_keyword)
                else:
                    p = _parse_seed_from_content(a.content)
                    if p:
                        push(p[0])
            if len(out) >= 40:
                break
    return out[:30]


def progression_from_article_seeds(articles: Iterable[Article]) -> dict[str, str]:
    out: dict[str, str] = {}
    for a in articles:
        cat = normalize_category(getattr(a, "generation_seed_category", "") or "")
        if not cat:
            continue
        raw = getattr(a, "generation_seed_level", None) or ""
        if not str(raw).strip():
            continue
        lvl = normalize_level(str(raw))
        prev = out.get(cat)
        if prev is None or LEVEL_ORDER.index(lvl) > LEVEL_ORDER.index(prev):
            out[cat] = lvl
    return out


def merge_progression_by_rank(a: dict[str, str], b: dict[str, str]) -> dict[str, str]:
    def rk(x: str | None) -> int:
        return LEVEL_ORDER.index(x) if x and x in LEVEL_ORDER else -1

    a_norm = {normalize_category(str(k)): str(v) for k, v in a.items() if k and v}
    b_norm = {normalize_category(str(k)): str(v) for k, v in b.items() if k and v}
    out: dict[str, str] = {}
    for cat in set(a_norm) | set(b_norm):
        m = max(rk(a_norm.get(cat)), rk(b_norm.get(cat)))
        if m >= 0:
            out[cat] = LEVEL_ORDER[m]
    return out


def _usage_map(dataset: ArticleKeywordDataset, fingerprints: list[str]) -> dict[str, KeywordUsageStat]:
    if not fingerprints:
        return {}
    stats = KeywordUsageStat.objects.filter(dataset=dataset, fingerprint__in=fingerprints)
    return {s.fingerprint: s for s in stats}


def _row_weight(
    *,
    fp: str,
    level: str,
    stat: KeywordUsageStat | None,
    preferred_level: str,
    avoid_hard: set[str],
    now,
) -> float:
    if fp in avoid_hard:
        return 0.0
    usage = stat.usage_count if stat else 0
    last_used = stat.last_used_at if stat else None
    w_usage = 1.0 / (1.0 + float(usage) * 2.5)
    if last_used is None:
        w_recency = 3.5
    else:
        days = (now - last_used).total_seconds() / 86400.0
        w_recency = min(4.0, 1.0 + days / 14.0)
    w_level = 4.0 if level == preferred_level else 1.0
    if level in LEVEL_ORDER and preferred_level in LEVEL_ORDER:
        if LEVEL_ORDER.index(level) < LEVEL_ORDER.index(preferred_level):
            w_level *= 0.35
    return max(0.01, w_usage * w_recency * w_level)


def pick_keyword_row(
    rows: list[dict[str, Any]],
    *,
    dataset: ArticleKeywordDataset,
    category_filter: str,
    avoid_fingerprints: set[str],
    progression_by_category: dict[str, str] | None = None,
    now=None,
) -> dict[str, Any]:
    """Return one dataset row dict (mutates nothing)."""
    now = now or timezone.now()
    if not rows:
        raise ValueError("No keyword rows")

    prog = {normalize_category(str(k)): str(v) for k, v in (progression_by_category or {}).items() if k and v}

    fps = [keyword_fingerprint(str(r.get("category") or ""), str(r.get("keyword") or "")) for r in rows]
    usage_by_fp = _usage_map(dataset, fps)

    weights: list[float] = []
    for r, fp in zip(rows, fps):
        cat = normalize_category(
            str(r.get("category") or (category_filter if category_filter != "all" else "") or "others")
        )
        lvl = normalize_level(str(r.get("level") or r.get("tier") or r.get("difficulty") or ""))
        preferred_level = next_level_after(prog.get(cat))
        st = usage_by_fp.get(fp)
        w = _row_weight(
            fp=fp,
            level=lvl,
            stat=st,
            preferred_level=preferred_level,
            avoid_hard=avoid_fingerprints,
            now=now,
        )
        weights.append(w)

    if sum(weights) <= 0:
        weights = []
        for r, fp in zip(rows, fps):
            cat = normalize_category(
                str(r.get("category") or (category_filter if category_filter != "all" else "") or "others")
            )
            lvl = normalize_level(str(r.get("level") or r.get("tier") or r.get("difficulty") or ""))
            preferred_level = next_level_after(prog.get(cat))
            st = usage_by_fp.get(fp)
            w = _row_weight(
                fp=fp,
                level=lvl,
                stat=st,
                preferred_level=preferred_level,
                avoid_hard=set(),
                now=now,
            )
            weights.append(w * (0.25 if fp in avoid_fingerprints else 1.0))

    total = sum(weights)
    if total <= 0:
        return random.choice(rows)
    pick = random.uniform(0, total)
    upto = 0.0
    for r, w in zip(rows, weights):
        upto += w
        if pick <= upto:
            return r
    return rows[-1]


@transaction.atomic
def record_successful_generation(
    *,
    dataset: ArticleKeywordDataset,
    category: str,
    keyword: str,
    title: str,
    level_used: str,
) -> None:
    fp = keyword_fingerprint(category, keyword)
    stat, _ = KeywordUsageStat.objects.select_for_update().get_or_create(
        dataset=dataset,
        fingerprint=fp,
        defaults={
            "category": normalize_category(category),
            "keyword": keyword[:500],
            "usage_count": 0,
            "last_used_at": None,
        },
    )
    stat.usage_count += 1
    stat.last_used_at = timezone.now()
    stat.keyword = keyword[:500]
    stat.category = normalize_category(category)
    stat.save(update_fields=["usage_count", "last_used_at", "keyword", "category"])

    state, _ = MembershipGenerationState.objects.select_for_update().get_or_create(
        pk=1,
        defaults={
            "progression_by_category": {},
            "recent_keyword_fingerprints": [],
            "recent_titles": [],
        },
    )
    prog = dict(state.progression_by_category) if isinstance(state.progression_by_category, dict) else {}
    cat = normalize_category(category)
    prog[cat] = level_used

    fps = [fp] + [x for x in (state.recent_keyword_fingerprints or []) if x != fp]
    fps = fps[:60]
    titles = [title[:500]] + [x for x in (state.recent_titles or []) if x != title[:500]]
    titles = titles[:60]

    state.progression_by_category = prog
    state.recent_keyword_fingerprints = fps
    state.recent_titles = titles
    state.save(update_fields=["progression_by_category", "recent_keyword_fingerprints", "recent_titles", "updated_at"])
