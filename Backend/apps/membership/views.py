import uuid

from django.db.models import Q
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import generics, status, views
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.membership.json_tags import filter_articles_with_tag
from apps.membership.generation import (
    collect_avoid_fingerprints,
    collect_avoid_keyword_phrases,
    merge_progression_by_rank,
    pick_keyword_row,
    progression_from_article_seeds,
    record_successful_generation,
)
from apps.membership.keyword_dataset import VALID_CATEGORIES, dataset_category_counts, normalize_category
from apps.membership.keyword_levels import normalize_level
from apps.membership.models import Article, ArticleKeywordDataset, MembershipGenerationState, Video
from apps.membership.permissions import MembershipPublicReadOrAuthenticated
from apps.membership.redis_index import cache_get_merged_ids, cache_set_merged_ids, search_article_ids, tokenize
from apps.membership.serializers import ArticleSerializer, VideoSerializer
from apps.portal.permissions import IsAuthenticatedStrict
from apps.video_streaming.models import StreamVideo
from apps.video_streaming.serializers import StreamVideoListSerializer, StreamVideoStreamSerializer
from apps.video_streaming.playback_access import (
    user_can_play_membership_stream_video,
    user_has_membership_stream_catalog_access,
)
from apps.video_streaming.services.playback_delivery import build_playback_url_for_video


class MembershipPagination(PageNumberPagination):
    page_size = 150
    page_size_query_param = "page_size"
    max_page_size = 150


def _ordered_qs(qs, sort: str):
    if sort == "oldest":
        return qs.order_by("published_at", "id")
    return qs.order_by("-published_at", "-id")


def _merge_search_pks(qs, q: str, cache_params: str) -> tuple[set[int], str]:
    q = (q or "").strip()
    if not q:
        return set(qs.values_list("pk", flat=True)), "database"

    cached = cache_get_merged_ids(cache_params)
    if cached is not None:
        return set(cached), "redis_cache"

    db_q = Q(title__icontains=q) | Q(description__icontains=q) | Q(content__icontains=q)
    db_ids = set(qs.filter(db_q).values_list("pk", flat=True))
    redis_ids = search_article_ids(q)

    if redis_ids is None:
        merged = db_ids
        src = "database"
    else:
        merged = redis_ids | db_ids
        if db_ids and not redis_ids:
            src = "database"
        elif redis_ids and not db_ids:
            src = "redis"
        else:
            src = "mixed"

    cache_set_merged_ids(cache_params, list(merged))
    return merged, src


def build_article_queryset(request) -> tuple:
    qs = Article.objects.all()
    sort = (request.query_params.get("sort") or "newest").lower()
    if sort not in ("newest", "oldest"):
        sort = "newest"
    date_from = (request.query_params.get("date_from") or "").strip()
    date_to = (request.query_params.get("date_to") or "").strip()
    q = (request.query_params.get("q") or "").strip()
    search_in = (request.query_params.get("search_in") or "all").strip().lower()
    if search_in not in {"all", "title"}:
        search_in = "all"
    d_from = parse_date(date_from) if date_from else None
    d_to = parse_date(date_to) if date_to else None
    if d_from:
        qs = qs.filter(published_at__date__gte=d_from)
    if d_to:
        qs = qs.filter(published_at__date__lte=d_to)

    meta = None
    if q:
        if search_in == "title":
            qs = qs.filter(title__icontains=q)
            meta = {"search_source": "database_title", "tokens": list(tokenize(q))}
        else:
            cache_params = f"q={q}&date_from={date_from}&date_to={date_to}"
            merged, src = _merge_search_pks(qs, q, cache_params)
            meta = {"search_source": src, "tokens": list(tokenize(q))}
            if not merged:
                qs = qs.none()
            else:
                qs = qs.filter(pk__in=merged)

    qs = _ordered_qs(qs, sort)
    return qs, meta


class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [MembershipPublicReadOrAuthenticated]
    pagination_class = MembershipPagination

    def get_queryset(self):
        qs, self._membership_search_meta = build_article_queryset(self.request)
        return qs

    def list(self, request, *args, **kwargs):
        self._membership_search_meta = None
        response = super().list(request, *args, **kwargs)
        meta = getattr(self, "_membership_search_meta", None)
        if meta and isinstance(response.data, dict):
            response.data["search_source"] = meta["search_source"]
            response.data["tokens"] = meta["tokens"]
        return response


class ArticleDetailView(generics.RetrieveAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [MembershipPublicReadOrAuthenticated]
    lookup_field = "slug"
    queryset = Article.objects.all()


class VideoListView(generics.ListAPIView):
    serializer_class = VideoSerializer
    permission_classes = [MembershipPublicReadOrAuthenticated]
    pagination_class = MembershipPagination

    def get_queryset(self):
        return Video.objects.all().order_by("-created_at", "-id")


class MembershipSecureVideoListView(generics.ListAPIView):
    serializer_class = StreamVideoListSerializer
    permission_classes = [IsAuthenticatedStrict]
    pagination_class = MembershipPagination

    def get_queryset(self):
        if not user_has_membership_stream_catalog_access(self.request.user):
            return StreamVideo.objects.none()
        return StreamVideo.objects.filter(show_in_membership=True).order_by("-created_at", "-id")


class MembershipSecureVideoStreamView(APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk: int, *args, **kwargs):
        video = get_object_or_404(StreamVideo, pk=pk, show_in_membership=True)

        if not user_can_play_membership_stream_video(request.user, video):
            return Response(
                {"detail": "You do not have access to this video."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not video.original_video or not video.original_video.name:
            payload = {"id": video.id, "status": video.status, "playback_url": None}
            return Response(StreamVideoStreamSerializer(payload).data, status=status.HTTP_200_OK)

        if video.status != StreamVideo.Status.READY:
            payload = {"id": video.id, "status": video.status, "playback_url": None}
            return Response(StreamVideoStreamSerializer(payload).data, status=status.HTTP_200_OK)

        url = build_playback_url_for_video(
            request,
            user_id=request.user.id,
            video=video,
            access_mode="membership",
        )
        if not url:
            return Response(
                {"detail": "Playback is temporarily unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        payload = {"id": video.id, "status": video.status, "playback_url": url}
        return Response(StreamVideoStreamSerializer(payload).data, status=status.HTTP_200_OK)


class MembershipSearchView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [MembershipPublicReadOrAuthenticated]
    pagination_class = MembershipPagination

    def get_queryset(self):
        qs, self._membership_search_meta = build_article_queryset(self.request)
        return qs

    def list(self, request, *args, **kwargs):
        self._membership_search_meta = None
        response = super().list(request, *args, **kwargs)
        q = (request.query_params.get("q") or "").strip()
        if isinstance(response.data, dict):
            if q:
                meta = getattr(self, "_membership_search_meta", None) or {"search_source": "database", "tokens": []}
                response.data["search_source"] = meta["search_source"]
                response.data["tokens"] = meta["tokens"]
            else:
                response.data["search_source"] = "database"
                response.data["tokens"] = []
        return response


class ArticleTagsView(views.APIView):
    permission_classes = [MembershipPublicReadOrAuthenticated]

    def get(self, request):
        tags: set[str] = set()
        for row in Article.objects.values_list("tags", flat=True):
            if isinstance(row, list):
                tags.update(str(t) for t in row if t)
        return Response(sorted(tags))


class ArticlePdfView(APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk: int):
        article = get_object_or_404(Article, pk=pk)
        if not article.pdf_file:
            raise Http404()
        try:
            fh = article.pdf_file.open("rb")
        except Exception:
            raise Http404()
        name = article.pdf_file.name.rsplit("/", 1)[-1]
        resp = FileResponse(fh, content_type="application/pdf")
        resp["Content-Disposition"] = f'inline; filename="{name}"'
        return resp


class MembershipGeneratedArticleMetaView(APIView):
    permission_classes = [MembershipPublicReadOrAuthenticated]

    def get(self, request):
        server_local_date = timezone.localdate().isoformat()
        ds = ArticleKeywordDataset.objects.filter(is_active=True).first()
        if not ds:
            return Response(
                {"active": False, "categories": {}, "total": 0, "server_local_date": server_local_date}
            )
        rows = ds.rows if isinstance(ds.rows, list) else []
        counts = dataset_category_counts(rows)
        return Response(
            {
                "active": True,
                "categories": counts,
                "total": len(rows),
                "server_local_date": server_local_date,
            }
        )


class MembershipGeneratedArticleView(APIView):
    permission_classes = [MembershipPublicReadOrAuthenticated]

    def post(self, request):
        today = timezone.localdate()
        existing_today = (
            filter_articles_with_tag(Article.objects.filter(published_at__date=today), "operator-brief")
            .order_by("-published_at", "-id")
            .first()
        )
        if existing_today:
            return Response(
                {
                    "detail": "Daily generation limit reached (1 article per day).",
                    "already_generated_today": True,
                    "article_id": existing_today.id,
                    "article_slug": existing_today.slug,
                    "server_local_date": today.isoformat(),
                },
                status=status.HTTP_200_OK,
            )

        ds = ArticleKeywordDataset.objects.filter(is_active=True).first()
        if not ds or not isinstance(ds.rows, list) or not ds.rows:
            return Response(
                {"detail": "No active keyword dataset. Upload a CSV in Django admin and mark it active."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        cat_req = (request.data.get("category") or "all").strip().lower()
        if cat_req not in {"all", *VALID_CATEGORIES}:
            return Response({"detail": "Invalid category. Use all, business, money, power, grooming, or others."}, status=400)

        rows = [r for r in ds.rows if isinstance(r, dict) and str(r.get("keyword") or "").strip()]
        if cat_req != "all":
            rows = [r for r in rows if normalize_category(str(r.get("category") or "")) == cat_req]
        if not rows:
            return Response({"detail": "No keywords for that category in the active dataset."}, status=400)

        read_slugs_in = request.data.get("read_slugs")
        read_slugs: list[str] = []
        if isinstance(read_slugs_in, list):
            read_slugs = [str(x).strip() for x in read_slugs_in if str(x).strip()][:32]

        read_articles: list[Article] = []
        for slug in read_slugs:
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
            dataset=ds,
            category_filter=cat_req,
            avoid_fingerprints=avoid_fps,
            progression_by_category=eff_prog,
        )
        keyword = str(row.get("keyword") or "").strip()
        category = normalize_category(str(row.get("category") or cat_req))
        level_used = normalize_level(str(row.get("level") or row.get("tier") or row.get("difficulty") or ""))

        avoid_in = request.data.get("avoid_titles")
        avoid: list[str] = []
        if isinstance(avoid_in, list):
            avoid = [str(x).strip() for x in avoid_in if str(x).strip()][:40]

        recent_titles = list(state.recent_titles) if state and state.recent_titles else []
        merged_titles: list[str] = []
        seen_t = set()
        for t in avoid + recent_titles:
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

        seed = uuid.uuid4().hex[:14]
        try:
            from api.services.openai_client import generate_membership_article

            body = generate_membership_article(
                keyword=keyword,
                category=category,
                avoid_titles=merged_titles,
                avoid_keywords=avoid_keywords,
                creative_seed=seed,
            )
        except RuntimeError as e:
            msg = str(e)
            if "OPENAI_API_KEY" in msg:
                return Response(
                    {"detail": "Article generation is not configured (OPENAI_API_KEY missing)."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return Response({"detail": msg or "Generation failed."}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            return Response({"detail": str(e) or "Generation failed."}, status=status.HTTP_502_BAD_GATEWAY)

        body["keyword_used"] = keyword
        body["category_used"] = category
        body["level_used"] = level_used

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

        tags = ["operator-brief", category]
        article = Article(
            title=str(body.get("title") or "Operator brief")[:500],
            description=description,
            content=content,
            tags=tags,
            source_url="",
            thumbnail="",
            is_featured=False,
            generation_seed_keyword=keyword[:500],
            generation_seed_category=category,
            generation_seed_level=level_used,
        )
        article.save()
        record_successful_generation(
            dataset=ds,
            category=category,
            keyword=keyword,
            title=article.title,
            level_used=level_used,
        )
        body["article_id"] = article.id
        body["article_slug"] = article.slug
        body["server_local_date"] = timezone.localdate().isoformat()

        return Response(body)
