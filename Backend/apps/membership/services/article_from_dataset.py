"""Create membership articles from the active ArticleKeywordDataset (admin uploads)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from django.utils import timezone

from apps.membership.generation import (
    collect_avoid_fingerprints,
    collect_avoid_keyword_phrases,
    merge_progression_by_rank,
    pick_keyword_row,
    progression_from_article_seeds,
    record_successful_generation,
)
from apps.membership.json_tags import filter_articles_with_tag
from apps.membership.keyword_dataset import VALID_CATEGORIES, normalize_category
from apps.membership.keyword_levels import normalize_level
from apps.membership.models import Article, ArticleKeywordDataset, MembershipGenerationState


def membership_deploy_bootstrap_completed() -> bool:
    state = (
        MembershipGenerationState.objects.filter(pk=1)
        .only("membership_articles_bootstrap_completed_at")
        .first()
    )
    return bool(state and state.membership_articles_bootstrap_completed_at)


def mark_membership_deploy_bootstrap_completed() -> None:
    state, _ = MembershipGenerationState.objects.get_or_create(
        pk=1,
        defaults={
            "progression_by_category": {},
            "recent_keyword_fingerprints": [],
            "recent_titles": [],
        },
    )
    if state.membership_articles_bootstrap_completed_at:
        return
    state.membership_articles_bootstrap_completed_at = timezone.now()
    state.save(update_fields=["membership_articles_bootstrap_completed_at", "updated_at"])

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
    state_fps = list(state.recent_keyword_fingerprints) if state and state.recent_keyword_fingerprints else []
    avoid_fps = collect_avoid_fingerprints(state_fps=state_fps, read_slugs=read_slugs)

    base_prog: dict[str, str] = {}
    if state and isinstance(state.progression_by_category, dict):
        base_prog = {normalize_category(str(k)): str(v) for k, v in state.progression_by_category.items() if k and v}
    read_prog = progression_from_article_seeds(read_articles)
    eff_prog = merge_progression_by_rank(base_prog, read_prog)

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

    recent_titles = list(state.recent_titles) if state and state.recent_titles else []
    merged_titles: list[str] = []
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
    stop_on_error: bool = False,
) -> list[GeneratedMembershipArticle]:
    ds = dataset or get_active_keyword_dataset(dataset_id=dataset_id)
    if not ds:
        raise NoActiveKeywordDatasetError(
            "No active keyword dataset with rows. Upload a file in Django admin and mark it active."
        )

    out: list[GeneratedMembershipArticle] = []
    for _ in range(max(0, int(count))):
        try:
            out.append(
                generate_one_membership_article_from_dataset(
                    dataset=ds,
                    category_filter=category_filter,
                    use_openai=use_openai,
                    allow_stub_without_openai=allow_stub_without_openai,
                )
            )
        except MembershipArticleGenerationError:
            if stop_on_error:
                raise
            break
    return out
