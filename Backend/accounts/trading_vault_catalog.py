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
    ("The Confirmation Signal", "Secrets_M1_Final.mp4"),
    ("Drawing Proper Trendlines", "Secrets_M2_Final.mp4"),
    ("Scene of the Crime Retrace", "Secrets_M3.mp4"),
    ("Measured Move", "Secrets_M4.mp4"),
    ("Three Tail Theory", "Secrets_M5.mp4"),
    ("Trading Parallels", "Secrets_M6.mp4"),
    ("Major vs Minor Support and Resistance", "Secrets_M7.mp4"),
    ("Multi-Hit Methodology", "Secrets_M8.mp4"),
    ("Trading the Hit and Kiss of a Level", "Secrets_M9.mp4"),
    ("Macro Versus Micro Patterns", "Secrets_M10.mp4"),
    ("Bull and Bear Flag Flips", "Secrets_M11.mp4"),
    ("Trading RSI Divergences", "Secrets_M12.mp4"),
    ("Time Counts", "Secrets_M13.mp4"),
    ("The Biggest Moves Come from Failed Moves", "Secrets_M14.mp4"),
    ("Time Value of a Level", "Secrets_M15.mp4"),
    ("Fine-Tuning Entry Points", "Secrets_M16.mp4"),
    ("Goals and Expectations", "Secrets_Goals.mp4"),
)

TRADING_SETUPS_FILES: tuple[tuple[str, str], ...] = (
    ("Introduction", "Setups_Intro.mp4"),
    ("Setups of a Master Trader", "Setups_M1_Final.mp4"),
    ("Bull and Bear Flag Setups", "Setups_M2_Final.mp4"),
    ("Cup and Handle Setups", "Setups_M3_Final.mp4"),
    ("Mature Versus Immature Patterns and Setups", "Setups_M4_final.mp4"),
    ("Megaphone and Consolidation Patterns", "Setups_M5_Final.mp4"),
    ("Downsloping and Upsloping Channels", "Setups_M6_Final.mp4"),
    ("Double Tops and Double Bottoms", "Setups_M7_Final.mp4"),
    ("Triple Tops and Beyond", "Setups_M8_Final.mp4"),
    ("The M-A Pattern", "Setups_M9_Final.mp4"),
    ("The W-V Pattern", "Setups_M10_Final.mp4"),
    ("Gaps and Gap Fills", "Setups_M11_Final.mp4"),
    ("The Power of the Move", "Setups_M12_Final.mp4"),
    ("Trading the Golden and Death Cross Setup", "Setups_13_Final.mp4"),
    ("Trading Doji Candle Setups", "Setusp_M14_final.mp4"),
    ("Topping and Bottoming Tail Setups", "Setups_M15_Final.mp4"),
    ("Engulfing Candle Setups", "Setups_M16_Final.mp4"),
    ("Wise Words for Master Setups", "Setups_Closing_Final.mp4"),
)

TRADING_STRATEGIES_FILES: tuple[tuple[str, str], ...] = (
    ("Strategies of a Master Trader", "Strategies_M1.mp4"),
    ("The Keys to Building Wealth", "Strategies_M2.mp4"),
    ("Favorite Trading Indicators", "Strategies_M3.mp4"),
    ("Charting Strategies for Indicators", "Strategies_M4.mp4"),
    ("Support & Resistance Strategies", "Strategies_M5.mp4"),
    ("Candlestick Trading Strategies", "Strategies_M6.mp4"),
    ("Risk vs Rewards & Rules to Trade", "Strategies_M7.mp4"),
    ("Extract the Market Capital", "StrategiesM8.mp4"),
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
