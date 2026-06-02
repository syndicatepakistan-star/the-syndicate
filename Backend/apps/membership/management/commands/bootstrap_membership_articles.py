from django.core.management import call_command
from django.core.management.base import BaseCommand

from apps.membership.services.article_from_dataset import (
    DEFAULT_MEMBERSHIP_ARTICLE_COUNT,
    count_operator_brief_articles,
    mark_membership_deploy_bootstrap_completed,
    membership_deploy_bootstrap_completed,
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
                membership_articles_bootstrap_completed_at=None
            )
            self.stdout.write(self.style.WARNING("Cleared deploy bootstrap flag."))

        if membership_deploy_bootstrap_completed() and not options["force"] and not options["reset_flag"]:
            self.stdout.write(
                self.style.SUCCESS(
                    "Deploy membership bootstrap already ran once; skipping (later pushes will not regenerate). "
                    "Use --force or --reset-flag to run again."
                )
            )
            return

        target = max(0, int(options["target"]))
        existing = count_operator_brief_articles()
        if existing >= target:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Already have {existing} operator-brief article(s) (target {target}). Skipping generation."
                )
            )
            mark_membership_deploy_bootstrap_completed()
            return

        call_command(
            "load_default_membership_keyword_dataset",
            force=bool(options["force_dataset"]),
            verbosity=options["verbosity"],
        )

        stub_args = ["--stub"] if options["stub"] else []
        call_command(
            "generate_membership_articles",
            *stub_args,
            f"--fill-to={target}",
            verbosity=options["verbosity"],
        )
        mark_membership_deploy_bootstrap_completed()
        self.stdout.write(
            self.style.SUCCESS(
                "Marked deploy bootstrap complete; future Railway deploys will skip article generation."
            )
        )
