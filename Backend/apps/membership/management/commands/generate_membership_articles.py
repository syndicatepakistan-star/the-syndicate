from django.core.management.base import BaseCommand

from apps.membership.services.article_from_dataset import (
    DEFAULT_MEMBERSHIP_ARTICLE_COUNT,
    MembershipArticleGenerationError,
    NoActiveKeywordDatasetError,
    OpenAINotConfiguredError,
    count_operator_brief_articles,
    generate_membership_articles_batch,
    get_active_keyword_dataset,
)


class Command(BaseCommand):
    help = (
        "Generate membership operator-brief articles from the active ArticleKeywordDataset "
        f"(default count: {DEFAULT_MEMBERSHIP_ARTICLE_COUNT}). Requires OPENAI_API_KEY unless --stub."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=DEFAULT_MEMBERSHIP_ARTICLE_COUNT,
            help=f"How many articles to generate (default {DEFAULT_MEMBERSHIP_ARTICLE_COUNT}).",
        )
        parser.add_argument(
            "--dataset-id",
            type=int,
            default=None,
            help="Use a specific dataset id instead of the active one.",
        )
        parser.add_argument(
            "--category",
            default="all",
            help="Category filter: all, business, money, power, grooming, others.",
        )
        parser.add_argument(
            "--stub",
            action="store_true",
            help="Skip OpenAI; write template articles from keyword seeds (dev/local).",
        )
        parser.add_argument(
            "--fill-to",
            type=int,
            default=None,
            help=(
                "Generate only enough articles so operator-brief count reaches this number "
                f"(e.g. --fill-to {DEFAULT_MEMBERSHIP_ARTICLE_COUNT})."
            ),
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would run without calling OpenAI or saving articles.",
        )

    def handle(self, *args, **options):
        count = max(0, int(options["count"]))
        fill_to = options["fill_to"]
        if fill_to is not None:
            existing = count_operator_brief_articles()
            count = max(0, int(fill_to) - existing)
            self.stdout.write(f"Operator-brief articles in DB: {existing}; will generate up to {count} more.")

        if count <= 0:
            self.stdout.write(self.style.SUCCESS("Nothing to generate."))
            return

        ds = get_active_keyword_dataset(dataset_id=options["dataset_id"])
        if not ds:
            raise NoActiveKeywordDatasetError(
                "No keyword dataset with rows. Run load_default_membership_keyword_dataset or upload in admin."
            )

        if options["dry_run"]:
            self.stdout.write(
                self.style.WARNING(
                    f"Dry run: would generate {count} article(s) from dataset “{ds.name}” "
                    f"({len(ds.rows or [])} seeds), category={options['category']}."
                )
            )
            return

        use_openai = not bool(options["stub"])
        try:
            generated = generate_membership_articles_batch(
                count=count,
                dataset=ds,
                category_filter=str(options["category"] or "all"),
                use_openai=use_openai,
                allow_stub_without_openai=bool(options["stub"]),
                stop_on_error=True,
            )
        except OpenAINotConfiguredError as e:
            self.stderr.write(
                self.style.ERROR(
                    f"{e} Set OPENAI_API_KEY or re-run with --stub for local template articles."
                )
            )
            return
        except MembershipArticleGenerationError as e:
            self.stderr.write(self.style.ERROR(str(e)))
            return

        for item in generated:
            self.stdout.write(f"  + {item.article.slug} — {item.article.title[:72]}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Generated {len(generated)} article(s). "
                f"Operator-brief total: {count_operator_brief_articles()}."
            )
        )
