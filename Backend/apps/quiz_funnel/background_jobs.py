"""Fire-and-forget jobs so quiz HTTP responses stay fast."""

from __future__ import annotations

import logging
import threading
from typing import Any

from django.db import close_old_connections

logger = logging.getLogger(__name__)


def run_in_background(name: str, fn, /, *args: Any, **kwargs: Any) -> None:
    """Run ``fn`` in a daemon thread. Never raises to the caller."""

    def _run() -> None:
        close_old_connections()
        try:
            fn(*args, **kwargs)
        except Exception:
            logger.exception("Background job failed: %s", name)
        finally:
            close_old_connections()

    threading.Thread(target=_run, daemon=True, name=name).start()
