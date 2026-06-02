from django.core.management import call_command
from django.core.management.base import BaseCommand

from apps.membership.services.article_from_dataset import (
    DEFAULT_MEMBERSHIP_ARTICLE_COUNT,
    count_operator_brief_articles_for_dataset,
    generate_membership_articles_batch,
    get_active_keyword_dataset,
    mark_membership_deploy_bootstrap_completed,
    membership_deploy_bootstrap_completed_for_dataset,
)


class Command(BaseCommand):
    help = (
        "Ensure the bundled 15-row keyword dataset is active, then generate operator-brief articles "
        f"until at least {DEFAULT_MEMBERSHIP_ARTICLE_COUNT} exist (uses OpenAI unless --stub)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--target",
            type=int,
            default=DEFAULT_MEMBERSHIP_ARTICLE_COUNT,
            help=f"Minimum operator-brief articles to keep (default {DEFAULT_MEMBERSHIP_ARTICLE_COUNT}).",
        )
        parser.add_argument(
            "--stub",
            action="store_true",
            help="Use template articles without OpenAI.",
        )
        parser.add_argument(
            "--force-dataset",
            action="store_true",
            help="Reload the bundled default keyword CSV even if another dataset is active.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Run even if deploy bootstrap already completed (does not clear the flag).",
        )
        parser.add_argument(
            "--reset-flag",
            action="store_true",
            help="Clear the one-time deploy flag, then run bootstrap (admin recovery).",
        )

    def handle(self, *args, **options):
        from apps.membership.models import MembershipGenerationState

        if options["reset_flag"]:
            MembershipGenerationState.objects.filter(pk=1).update(
                membership_articles_bootstrap_completed_at=None,
                membership_articles_bootstrap_dataset_id=None,
            )
            self.stdout.write(self.style.WARNING("Cleared deploy bootstrap flag and dataset link."))

        ds = get_active_keyword_dataset()
        if not ds:
            call_command(
                "load_default_membership_keyword_dataset",
                force=bool(options["force_dataset"]),
                verbosity=options["verbosity"],
            )
            ds = get_active_keyword_dataset()

        if not ds:
            self.stderr.write(
                self.style.ERROR(
                    "No active keyword dataset with rows. Upload your CSV in Django admin, mark Is active, then redeploy."
                )
            )
            return

        if (
            membership_deploy_bootstrap_completed_for_dataset(ds)
            and not options["force"]
            and not options["reset_flag"]
        ):
            matching = count_operator_brief_articles_for_dataset(ds)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Deploy bootstrap already completed for dataset “{ds.name}” "
                    f"({matching} article(s) match its seeds). Skipping."
                )
            )
            return

        target = max(0, int(options["target"]))
        matching = count_operator_brief_articles_for_dataset(ds)
        to_generate = max(0, target - matching)
        self.stdout.write(
            f"Active dataset: “{ds.name}” ({len(ds.rows or [])} seeds). "
            f"Articles matching this dataset: {matching}; will generate up to {to_generate}."
        )

        if to_generate <= 0:
            mark_membership_deploy_bootstrap_completed(dataset=ds)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Already have {matching} article(s) from this dataset (target {target}). "
                    "Marked bootstrap complete for this dataset."
                )
            )
            return

        stub = bool(options["stub"])
        generated = generate_membership_articles_batch(
            count=to_generate,
            dataset=ds,
            use_openai=not stub,
            allow_stub_without_openai=stub,
            stop_on_error=False,
        )
        for item in generated:
            self.stdout.write(f"  + {item.article.slug} — {item.keyword[:60]}")

        mark_membership_deploy_bootstrap_completed(dataset=ds)
        matching_after = count_operator_brief_articles_for_dataset(ds)
        self.stdout.write(
            self.style.SUCCESS(
                f"Generated {len(generated)} article(s) from “{ds.name}”. "
                f"Dataset-matched articles: {matching_after}. "
                "Future deploys skip until you activate a different keyword dataset."
            )
        )
