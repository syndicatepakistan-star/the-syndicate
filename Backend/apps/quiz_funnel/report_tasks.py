"""Background AI report generation so quiz submit returns immediately."""

from __future__ import annotations

import logging
import threading
from typing import Any

from django.db import close_old_connections

from .ai_service import PENDING_AI_REPORT, generate_ai_report

logger = logging.getLogger(__name__)


def schedule_ai_report_generation(*, user_pk: int, **report_kwargs: Any) -> None:
    """Generate the OpenAI report in a daemon thread and persist it on the user's Result."""

    def _run() -> None:
        close_old_connections()
        try:
            ai_report = generate_ai_report(**report_kwargs)
        except Exception:
            logger.exception("OpenAI report failed for user_pk=%s; using fallback template", user_pk)
            try:
                ai_report = generate_ai_report(**report_kwargs, force_fallback=True)
            except Exception:
                logger.exception("Fallback report failed for user_pk=%s", user_pk)
                return

        try:
            from .models import Result

            updated = Result.objects.filter(user_id=user_pk, ai_report=PENDING_AI_REPORT).update(
                ai_report=ai_report
            )
            if not updated:
                Result.objects.filter(user_id=user_pk).update(ai_report=ai_report)
        except Exception:
            logger.exception("Failed to save AI report for user_pk=%s", user_pk)
        finally:
            close_old_connections()

    threading.Thread(target=_run, daemon=True, name=f"quiz-ai-report-{user_pk}").start()
