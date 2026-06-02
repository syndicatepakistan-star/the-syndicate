"""Create membership articles from the active ArticleKeywordDataset (admin uploads)."""

from __future__ import annotations

import logging
import random
import uuid
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

from apps.membership.generation import (
    collect_avoid_fingerprints,
    collect_avoid_keyword_phrases,
    keyword_fingerprint,
    merge_progression_by_rank,
    pick_keyword_row,
    progression_from_article_seeds,
    record_successful_generation,
)
from apps.membership.json_tags import filter_articles_with_tag
from apps.membership.keyword_dataset import VALID_CATEGORIES, normalize_category
from apps.membership.keyword_levels import normalize_level
from apps.membership.models import Article, ArticleKeywordDataset, MembershipGenerationState

DEFAULT_MEMBERSHIP_ARTICLE_COUNT = 15
OPERATOR_BRIEF_TAG = "operator-brief"


class MembershipArticleGenerationError(Exception):
    """Base error for dataset-driven article generation."""


class NoActiveKeywordDatasetError(MembershipArticleGenerationError):
    pass


class OpenAINotConfiguredError(MembershipArticleGenerationError):
    pass


@dataclass
class GeneratedMembershipArticle:
    article: Article
    keyword: str
    category: str
    level_used: str
    openai_body: dict[str, Any]


def count_operator_brief_articles() -> int:
    return filter_articles_with_tag(Article.objects.all(), OPERATOR_BRIEF_TAG).count()


def get_active_keyword_dataset(*, dataset_id: int | None = None) -> ArticleKeywordDataset | None:
    if dataset_id is not None:
        ds = ArticleKeywordDataset.objects.filter(pk=dataset_id).first()
        if ds and isinstance(ds.rows, list) and ds.rows:
            return ds
        return None
    return (
        ArticleKeywordDataset.objects.filter(is_active=True)
        .exclude(rows=[])
        .order_by("-created_at", "-id")
        .first()
    )


def build_article_fields_from_openai_body(
    body: dict[str, Any],
    *,
    keyword: str,
    category: str,
    level_used: str,
) -> dict[str, Any]:
    key_points = [str(x).strip() for x in (body.get("key_points") or []) if str(x).strip()]
    paragraphs = [str(x).strip() for x in (body.get("paragraphs") or []) if str(x).strip()]
    desc_parts = key_points[:2] if key_points else paragraphs[:1]
    description = " ".join(desc_parts)[:900] if desc_parts else ""

    content_lines = [
        f"Seed: {keyword} - {category}",
        "",
        "Key points",
        "",
    ]
    for kp in key_points:
        content_lines.append(f"- {kp}")
    content_lines.extend(["", ""])
    content_lines.extend(paragraphs)
    content = "\n".join(content_lines).strip()

    return {
        "title": str(body.get("title") or "Operator brief")[:500],
        "description": description,
        "content": content,
        "tags": [OPERATOR_BRIEF_TAG, category],
        "source_url": "",
        "thumbnail": "",
        "is_featured": False,
        "generation_seed_keyword": keyword[:500],
        "generation_seed_category": category,
        "generation_seed_level": level_used,
    }


def _pick_row_fresh_batch(
    rows: list[dict[str, Any]],
    batch_avoid_fingerprints: set[str],
) -> dict[str, Any]:
    """Pick an unused dataset row; reuse rows only when the dataset is smaller than the batch size."""
    available: list[dict[str, Any]] = []
    for r in rows:
        cat = normalize_category(str(r.get("category") or ""))
        kw = str(r.get("keyword") or "").strip()
        if not kw:
            continue
        fp = keyword_fingerprint(cat, kw)
        if fp not in batch_avoid_fingerprints:
            available.append(r)
    pool = available if available else list(rows)
    return random.choice(pool)


@dataclass
class MembershipArticleBatchResult:
    generated: list[GeneratedMembershipArticle] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def _stub_openai_body(*, keyword: str, category: str) -> dict[str, Any]:
    title = f"{keyword[:80]} — operator brief"
    return {
        "title": title,
        "key_points": [
            f"Frame {keyword} as a repeatable operator habit, not a one-off tactic.",
            f"Connect {category} outcomes to measurable weekly actions.",
            "Document decisions and review them every seven days.",
            "Reduce friction: one clear next step after reading.",
            "Protect reputation: speed with discipline beats reckless urgency.",
        ],
        "paragraphs": [
            (
                f"This brief treats “{keyword}” as a practical lens for {category} work. "
                "Start with a single constraint you control this week—calendar, capital, or communication—and "
                "design one experiment that tests the idea in the field."
            ),
            (
                "Operators win by compounding small corrections. Write the hypothesis, run the experiment for "
                "seven days, and capture what moved: revenue, trust, energy, or clarity. Drop what fails; "
                "double down on what repeats."
            ),
            (
                "Syndicate standard: mastery without corruption. Use power and money as tools for stewardship, "
                "not spectacle. When in doubt, choose the action that strengthens long-term alliances and "
                "keeps your word unbreakable."
            ),
        ],
    }


def generate_one_membership_article_from_dataset(
    *,
    dataset: ArticleKeywordDataset,
    category_filter: str = "all",
    read_slugs: list[str] | None = None,
    avoid_titles: list[str] | None = None,
    batch_avoid_fingerprints: set[str] | None = None,
    fresh_batch: bool = False,
    use_openai: bool = True,
    allow_stub_without_openai: bool = False,
) -> GeneratedMembershipArticle:
    cat_req = (category_filter or "all").strip().lower()
    if cat_req not in {"all", *VALID_CATEGORIES}:
        raise MembershipArticleGenerationError(f"Invalid category filter: {category_filter!r}")

    rows = [r for r in (dataset.rows or []) if isinstance(r, dict) and str(r.get("keyword") or "").strip()]
    if cat_req != "all":
        rows = [r for r in rows if normalize_category(str(r.get("category") or "")) == cat_req]
    if not rows:
        raise MembershipArticleGenerationError("No keywords in dataset for the requested category.")

    read_slugs = read_slugs or []
    read_articles: list[Article] = []
    for slug in read_slugs[:32]:
        slug = (slug or "").strip()
        if not slug:
            continue
        a = Article.objects.filter(slug=slug).first()
        if a:
            read_articles.append(a)

    state = MembershipGenerationState.objects.filter(pk=1).first()

    if fresh_batch:
        avoid_fps = set(batch_avoid_fingerprints or [])
        eff_prog: dict[str, str] = {}
        merged_titles = [str(t).strip()[:500] for t in (avoid_titles or []) if str(t).strip()][:40]
        avoid_keywords: list[str] = []
    else:
        state_fps = list(state.recent_keyword_fingerprints) if state and state.recent_keyword_fingerprints else []
        avoid_fps = collect_avoid_fingerprints(state_fps=state_fps, read_slugs=read_slugs)
        avoid_fps |= set(batch_avoid_fingerprints or [])
        base_prog: dict[str, str] = {}
        if state and isinstance(state.progression_by_category, dict):
            base_prog = {normalize_category(str(k)): str(v) for k, v in state.progression_by_category.items() if k and v}
        read_prog = progression_from_article_seeds(read_articles)
        eff_prog = merge_progression_by_rank(base_prog, read_prog)
        recent_titles = list(state.recent_titles) if state and state.recent_titles else []
        merged_titles = []
        seen_t: set[str] = set()
        for t in (avoid_titles or []) + recent_titles:
            s = (t or "").strip()
            if not s:
                continue
            low = s.lower()
            if low in seen_t:
                continue
            seen_t.add(low)
            merged_titles.append(s[:500])
            if len(merged_titles) >= 40:
                break
        avoid_keywords = collect_avoid_keyword_phrases(read_slugs=read_slugs)

    if fresh_batch:
        row = _pick_row_fresh_batch(rows, avoid_fps)
    else:
        row = pick_keyword_row(
            rows,
            dataset=dataset,
            category_filter=cat_req,
            avoid_fingerprints=avoid_fps,
            progression_by_category=eff_prog,
        )
    keyword = str(row.get("keyword") or "").strip()
    category = normalize_category(str(row.get("category") or cat_req))
    level_used = normalize_level(str(row.get("level") or row.get("tier") or row.get("difficulty") or ""))
    creative_seed = uuid.uuid4().hex[:14]

    body: dict[str, Any]
    if use_openai:
        try:
            from api.services.openai_client import generate_membership_article

            body = generate_membership_article(
                keyword=keyword,
                category=category,
                avoid_titles=merged_titles,
                avoid_keywords=avoid_keywords,
                creative_seed=creative_seed,
            )
        except RuntimeError as e:
            msg = str(e)
            if "OPENAI_API_KEY" in msg:
                if allow_stub_without_openai:
                    body = _stub_openai_body(keyword=keyword, category=category)
                else:
                    raise OpenAINotConfiguredError(msg) from e
            else:
                raise MembershipArticleGenerationError(msg or "Generation failed.") from e
        except Exception as e:
            raise MembershipArticleGenerationError(str(e) or "Generation failed.") from e
    else:
        body = _stub_openai_body(keyword=keyword, category=category)

    fields = build_article_fields_from_openai_body(
        body,
        keyword=keyword,
        category=category,
        level_used=level_used,
    )
    article = Article(**fields)
    article.save()
    record_successful_generation(
        dataset=dataset,
        category=category,
        keyword=keyword,
        title=article.title,
        level_used=level_used,
    )
    return GeneratedMembershipArticle(
        article=article,
        keyword=keyword,
        category=category,
        level_used=level_used,
        openai_body=body,
    )


def generate_membership_articles_batch(
    *,
    count: int = DEFAULT_MEMBERSHIP_ARTICLE_COUNT,
    dataset: ArticleKeywordDataset | None = None,
    dataset_id: int | None = None,
    category_filter: str = "all",
    use_openai: bool = True,
    allow_stub_without_openai: bool = False,
    fresh_batch: bool = False,
    stop_on_error: bool = False,
) -> MembershipArticleBatchResult:
    ds = dataset or get_active_keyword_dataset(dataset_id=dataset_id)
    if not ds:
        raise NoActiveKeywordDatasetError(
            "No active keyword dataset with rows. Upload a file in Django admin and save."
        )

    result = MembershipArticleBatchResult()
    batch_fps: set[str] = set()
    for index in range(max(0, int(count))):
        try:
            item = generate_one_membership_article_from_dataset(
                dataset=ds,
                category_filter=category_filter,
                batch_avoid_fingerprints=batch_fps,
                fresh_batch=fresh_batch,
                use_openai=use_openai,
                allow_stub_without_openai=allow_stub_without_openai,
            )
            result.generated.append(item)
            batch_fps.add(keyword_fingerprint(item.category, item.keyword))
            logger.info(
                "membership article %s/%s saved id=%s slug=%s seed=%r",
                index + 1,
                count,
                item.article.id,
                item.article.slug,
                item.keyword[:80],
            )
        except OpenAINotConfiguredError:
            raise
        except MembershipArticleGenerationError as exc:
            msg = str(exc) or "Generation failed."
            result.errors.append(msg)
            logger.exception("membership article batch failed at %s/%s: %s", index + 1, count, msg)
            if stop_on_error:
                raise
            break
        except Exception as exc:
            msg = str(exc) or exc.__class__.__name__
            result.errors.append(msg)
            logger.exception("membership article batch unexpected error at %s/%s", index + 1, count)
            if stop_on_error:
                raise MembershipArticleGenerationError(msg) from exc
            break
    return result
