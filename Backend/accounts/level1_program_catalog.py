"""
Level 1 Programs — 11 Business Psychology + 11 Business Model playlists.

Stable catalog slugs (level1-psych-*, level1-model-*) survive DB wipes.
R2 layout: ``Business Psychology/{outer}/…/index.m3u8`` and ``Business Models/{outer}/…/index.m3u8``.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from apps.video_streaming.models import StreamPlaylist

LEVEL1_BUSINESS_PSYCHOLOGY_UNIT_USD = Decimal("99.00")
LEVEL1_BUSINESS_MODEL_UNIT_USD = Decimal("75.00")

# Deprecated: prefer per-program unit prices. Kept for older imports.
LEVEL1_CATEGORY_TOTAL_USD = LEVEL1_BUSINESS_MODEL_UNIT_USD * 11


@dataclass(frozen=True)
class Level1ProgramRow:
    catalog_slug: str
    title: str
    category: str
    r2_root: str
    r2_outer_folder: str
    r2_lesson_folder: str
    display_order: int


def _psych(
    index: int,
    title: str,
    outer: str,
    lesson: str,
) -> Level1ProgramRow:
    return Level1ProgramRow(
        catalog_slug=f"level1-psych-{index:02d}",
        title=title,
        category=StreamPlaylist.Category.BUSINESS_PSYCHOLOGY,
        r2_root="Business Psychology",
        r2_outer_folder=outer,
        r2_lesson_folder=lesson,
        display_order=index,
    )


def _model(
    index: int,
    title: str,
    outer: str,
    lesson: str,
) -> Level1ProgramRow:
    return Level1ProgramRow(
        catalog_slug=f"level1-model-{index:02d}",
        title=title,
        category=StreamPlaylist.Category.BUSINESS_MODEL,
        r2_root="Business Models",
        r2_outer_folder=outer,
        r2_lesson_folder=lesson,
        display_order=index,
    )


LEVEL1_PSYCHOLOGY_PROGRAMS: tuple[Level1ProgramRow, ...] = (
    _psych(1, "The 9 to 5 Exit Strategy", "9 to 5 Exit", "Lesson 1 - 9 to 5 Exit Strategy"),
    _psych(2, "Zero to One Million", "Zero to 1 Million", "Lesson 1 - Zero to One Million"),
    _psych(3, "Hustle Hard", "Hustle Hard", "Intro"),
    _psych(4, "Mastering Consistency", "Mastering Consistency", "Intro"),
    _psych(5, "The Secret To Transformation", "Secret To Transformation", "Intro"),
    _psych(6, "The Compound Effect", "Compound Effect", "Intro"),
    _psych(7, "The Micro Business Protocol", "Micro Business Protocol", "Intro"),
    _psych(8, "Mastering Risk and Uncertainty", "Risk and Uncertainty", "Intro"),
    _psych(9, "Business Warfare", "Business Warfare", "Intro"),
    _psych(10, "Syndicate 13 Business Rules", "13 Business Rules", "Intro"),
    _psych(11, "Syndicate Money Philosophy", "Money Philosophy", "Intro"),
)

LEVEL1_BUSINESS_MODEL_PROGRAMS: tuple[Level1ProgramRow, ...] = (
    _model(1, "N8N AI Automation", "N8N AI Automation", "Intro"),
    _model(2, "AI Automations", "Ai Automation", "Intro"),
    _model(3, "App Building (using Flutter)", "App Building Flutter", "Intro"),
    _model(4, "Building Apps using React JS", "React", ""),
    _model(5, "Book Publishing On Amazon (KINDLE)", "Amazon KDP", ""),
    _model(6, "Building Games Using Unreal Engine", "Unreal Engine", ""),
    _model(7, "Framer Crash Course", "Framer Crash Course", "Intro"),
    _model(8, "Graphics Design Using Canva", "Canva", "Intro"),
    _model(9, "Print On Demand Clothing", "Print On Demand", "Intro"),
    _model(10, "Python Programming", "Python", ""),
    _model(11, "WordPress Blog", "WordPress Blog", "Intro"),
)

LEVEL1_ALL_PROGRAMS: tuple[Level1ProgramRow, ...] = LEVEL1_PSYCHOLOGY_PROGRAMS + LEVEL1_BUSINESS_MODEL_PROGRAMS

LEVEL1_CATALOG_SLUGS: frozenset[str] = frozenset(row.catalog_slug for row in LEVEL1_ALL_PROGRAMS)

KNIGHT_SELECTABLE_LEVEL1_SLUGS: frozenset[str] = frozenset(
    list(row.catalog_slug for row in LEVEL1_PSYCHOLOGY_PROGRAMS[:9])
    + list(row.catalog_slug for row in LEVEL1_BUSINESS_MODEL_PROGRAMS)
)
