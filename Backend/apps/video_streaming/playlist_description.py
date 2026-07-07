"""
Split StreamPlaylist.description into fixed sections for Programs UI.

Admins paste one description in Django using section titles as **whole lines**
(case-insensitive). Optional markdown # prefixes are allowed.

Example::

    Introduction
    One tight paragraph that grabs attention.

    What you will learn
    - Outcome one
    - Outcome two

Legacy section titles ``The Hook`` and ``The core protocol`` are still parsed for older copy;
the core protocol body is not shown in the Programs UI.
"""

from __future__ import annotations

import re
from typing import TypedDict


class PlaylistDescriptionSections(TypedDict):
    hook: str
    core_protocol: str
    what_you_will_learn: str


# Line is only a section title (optional leading # / ## / ###)
_INTRO = re.compile(r"^\s*#*\s*(?:introduction|the hook)\s*$", re.IGNORECASE)
_CORE = re.compile(r"^\s*#*\s*(?:the\s+)?core protocol\s*$", re.IGNORECASE)
_LEARN = re.compile(r"^\s*#*\s*what you will learn\s*$", re.IGNORECASE)


def parse_playlist_description_sections(raw: str | None) -> PlaylistDescriptionSections:
    empty: PlaylistDescriptionSections = {"hook": "", "core_protocol": "", "what_you_will_learn": ""}
    if not raw or not str(raw).strip():
        return empty

    lines = str(raw).replace("\r\n", "\n").replace("\r", "\n").split("\n")
    markers: list[tuple[int, str]] = []
    seen: set[str] = set()
    for i, line in enumerate(lines):
        s = line.strip()
        if not s:
            continue
        if _INTRO.match(s) and "hook" not in seen:
            markers.append((i, "hook"))
            seen.add("hook")
        elif _CORE.match(s) and "core_protocol" not in seen:
            markers.append((i, "core_protocol"))
            seen.add("core_protocol")
        elif _LEARN.match(s) and "what_you_will_learn" not in seen:
            markers.append((i, "what_you_will_learn"))
            seen.add("what_you_will_learn")

    markers.sort(key=lambda x: x[0])
    if not markers:
        return empty

    out: PlaylistDescriptionSections = {"hook": "", "core_protocol": "", "what_you_will_learn": ""}
    for j, (idx, key) in enumerate(markers):
        start = idx + 1
        end = markers[j + 1][0] if j + 1 < len(markers) else len(lines)
        chunk = "\n".join(lines[start:end]).strip()
        if not chunk:
            continue
        if key == "hook":
            out["hook"] = chunk
        elif key == "core_protocol":
            out["core_protocol"] = chunk
        else:
            out["what_you_will_learn"] = chunk

    return out


def has_structured_sections(raw: str | None) -> bool:
    s = parse_playlist_description_sections(raw)
    return bool(s["hook"] or s["core_protocol"] or s["what_you_will_learn"])
