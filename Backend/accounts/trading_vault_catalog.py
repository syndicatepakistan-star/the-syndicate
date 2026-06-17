"""Trading Advanced Technical Analysis — module + nested submodule plan slugs (sync with frontend tradingVaultCatalog.ts)."""

from __future__ import annotations

TRADING_MODULE_SLUGS: frozenset[str] = frozenset(
    {
        "trading_master_secrets",
        "trading_master_setups",
        "trading_master_strategies",
        "trading_scalpel_protocol",
    }
)

TRADING_SECRETS_FILES: tuple[tuple[str, str], ...] = (
    ("Secrets Module 1", "Secrets_M1_Final.mp4"),
    ("Secrets Module 2", "Secrets_M2_Final.mp4"),
    ("Secrets Module 3", "Secrets_M3.mp4"),
    ("Secrets Module 4", "Secrets_M4.mp4"),
    ("Secrets Module 5", "Secrets_M5.mp4"),
    ("Secrets Module 6", "Secrets_M6.mp4"),
    ("Secrets Module 7", "Secrets_M7.mp4"),
    ("Secrets Module 8", "Secrets_M8.mp4"),
    ("Secrets Module 9", "Secrets_M9.mp4"),
    ("Secrets Module 10", "Secrets_M10.mp4"),
    ("Secrets Module 11", "Secrets_M11.mp4"),
    ("Secrets Module 12", "Secrets_M12.mp4"),
    ("Secrets Module 13", "Secrets_M13.mp4"),
    ("Secrets Module 14", "Secrets_M14.mp4"),
    ("Secrets Module 15", "Secrets_M15.mp4"),
    ("Secrets Module 16", "Secrets_M16.mp4"),
    ("Secrets Goals", "Secrets_Goals.mp4"),
    ("Secrets Recap — Setups", "Secrets_Recap_Setups.mp4"),
    ("Secrets Recap — Strategies", "Secrets_Recap_Strategies.mp4"),
)

TRADING_SETUPS_FILES: tuple[tuple[str, str], ...] = (
    ("Setups Introduction", "Setups_Intro.mp4"),
    ("Setups Module 1", "Setups_M1_Final.mp4"),
    ("Setups Module 2", "Setups_M2_Final.mp4"),
    ("Setups Module 3", "Setups_M3_Final.mp4"),
    ("Setups Module 4", "Setups_M4_final.mp4"),
    ("Setups Module 5", "Setups_M5_Final.mp4"),
    ("Setups Module 6", "Setups_M6_Final.mp4"),
    ("Setups Module 7", "Setups_M7_Final.mp4"),
    ("Setups Module 8", "Setups_M8_Final.mp4"),
    ("Setups Module 9", "Setups_M9_Final.mp4"),
    ("Setups Module 10", "Setups_M10_Final.mp4"),
    ("Setups Module 11", "Setups_M11_Final.mp4"),
    ("Setups Module 12", "Setups_M12_Final.mp4"),
    ("Setups Module 13", "Setups_13_Final.mp4"),
    ("Setups Module 14", "Setusp_M14_final.mp4"),
    ("Setups Module 15", "Setups_M15_Final.mp4"),
    ("Setups Module 16", "Setups_M16_Final.mp4"),
    ("Setups Closing", "Setups_Closing_Final.mp4"),
)

TRADING_STRATEGIES_FILES: tuple[tuple[str, str], ...] = (
    ("Strategies Module 1", "Strategies_M1.mp4"),
    ("Strategies Module 2", "Strategies_M2.mp4"),
    ("Strategies Module 3", "Strategies_M3.mp4"),
    ("Strategies Module 4", "Strategies_M4.mp4"),
    ("Strategies Module 5", "Strategies_M5.mp4"),
    ("Strategies Module 6", "Strategies_M6.mp4"),
    ("Strategies Module 7", "Strategies_M7.mp4"),
    ("Strategies Module 8", "StrategiesM8.mp4"),
)

TRADING_SCALPEL_FILES: tuple[tuple[str, str], ...] = (
    ("Chapter 1 — Introduction", "1. Chapter 1 - Introduction Course.mp4"),
    ("Chapter 2 — Bull and Bear Flags", "2. Chapter 2 - Bull and Bear Flags.mp4"),
    ("Chapter 3 — Falling Wedges", "3. Chapter 3 - Falling Wedges.mp4"),
    ("Chapter 4 — Rising Wedges", "4. Chapter 4 - Rising Wedges.mp4"),
    ("Chapter 5 — Moving Averages Strategies", "5. Chapter 5 - Moving Averages Strategies.mp4"),
    ("Chapter 6 — Parallels and Channels", "6. Module 6 Parallels and Channels.mp4"),
    ("Chapter 7 — Final Protocol", "7. Module chapter 7 final video.mp4"),
    ("Chapter 8 — Retrace to the Scene of Crime", "8. Chapter 8 - Retrace to the Scene of Crime.mp4"),
    ("Chapter 9 — Risk Management", "9. Chapter 9 - Risk Management.mp4"),
    ("Chapter 10 — Final Execution", "10. Module chapter 10_final video.mp4"),
)

TRADING_MODULE_TITLES: dict[str, str] = {
    "trading_master_secrets": "Secrets of a Master Trader",
    "trading_master_setups": "Setups of a Master Trader",
    "trading_master_strategies": "Strategies of a Master Trader",
    "trading_scalpel_protocol": "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
}


def _indexed_submodules(
    prefix: str,
    rows: tuple[tuple[str, str], ...],
) -> dict[str, tuple[str, str]]:
    out: dict[str, tuple[str, str]] = {}
    for i, (title, filename) in enumerate(rows, start=1):
        slug = f"{prefix}_{i:02d}"
        out[slug] = (title, filename)
    return out


TRADING_SUBMODULES: dict[str, tuple[str, str]] = {
    **_indexed_submodules("trading_secrets", TRADING_SECRETS_FILES),
    **_indexed_submodules("trading_setups", TRADING_SETUPS_FILES),
    **_indexed_submodules("trading_strategies", TRADING_STRATEGIES_FILES),
    **_indexed_submodules("trading_scalpel", TRADING_SCALPEL_FILES),
}

TRADING_SUBMODULE_PARENT: dict[str, str] = {
    slug: "trading_master_secrets"
    for slug in _indexed_submodules("trading_secrets", TRADING_SECRETS_FILES)
}
TRADING_SUBMODULE_PARENT.update(
    {slug: "trading_master_setups" for slug in _indexed_submodules("trading_setups", TRADING_SETUPS_FILES)}
)
TRADING_SUBMODULE_PARENT.update(
    {slug: "trading_master_strategies" for slug in _indexed_submodules("trading_strategies", TRADING_STRATEGIES_FILES)}
)
TRADING_SUBMODULE_PARENT.update(
    {slug: "trading_scalpel_protocol" for slug in _indexed_submodules("trading_scalpel", TRADING_SCALPEL_FILES)}
)


def trading_parent_module_for_slug(plan: str) -> str | None:
    return TRADING_SUBMODULE_PARENT.get((plan or "").strip().lower())


def is_trading_submodule_slug(plan: str) -> bool:
    return (plan or "").strip().lower() in TRADING_SUBMODULES


def trading_submodule_titles_for_catalog() -> dict[str, str]:
    return {slug: title for slug, (title, _) in TRADING_SUBMODULES.items()}
