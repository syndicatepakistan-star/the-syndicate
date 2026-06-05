from django.core.management.base import BaseCommand

from apps.quiz_funnel.models import QuizOption, QuizQuestion
from apps.quiz_funnel.quiz_data import QUIZ_QUESTIONS


class Command(BaseCommand):
    help = "Reload quiz funnel questions from quiz_data.py (Sovereign Entity Audit)."

    def handle(self, *args, **options):
        QuizOption.objects.all().delete()
        QuizQuestion.objects.all().delete()

        for item in QUIZ_QUESTIONS:
            section_label = ""
            if item["question"].startswith("[") and "]" in item["question"]:
                section_label = item["question"][1 : item["question"].index("]")]

            question = QuizQuestion.objects.create(
                id=item["id"],
                question_text=item["question"],
                section=section_label,
            )
            for index, option in enumerate(item["options"]):
                QuizOption.objects.create(
                    question=question,
                    option_letter=option[:1],
                    option_text=option,
                    position=index,
                )

        self.stdout.write(self.style.SUCCESS(f"Synced {len(QUIZ_QUESTIONS)} Sovereign Entity Audit questions."))
