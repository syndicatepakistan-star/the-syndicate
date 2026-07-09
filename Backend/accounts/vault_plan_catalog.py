"""Vault pack + individual course plan slugs for Stripe billing (sync indices with frontend vaultPackCatalog.ts)."""

from __future__ import annotations

import re

from accounts.trading_vault_catalog import (
    TRADING_MODULE_SLUGS,
    TRADING_MODULE_TITLES,
    trading_parent_module_for_slug,
    trading_submodule_titles_for_catalog,
)

AGENTIC_AI_COURSE_TITLES: tuple[str, ...] = (
  "Build a Blog Writing Agent With N8N",
  "Build a WhatsApp Agent with n8n",
  "Build Apps With secret Claude Code Skill",
  "Claude Code + Consensus for INSANE $50k+ App Ideas",
  "Is Claude Code Better than n8n",
  "Claude Code Memory Change",
  "Claude Cowork Automations",
  "Scrap Any Website with N8N",
  "Set up Google Credentials in n8n",
  "Google Antigravity FULL COURSE 2 HOURS",
  "n8n Tutorial 37 Tips and Tricks (n8n Masterclass)",
  "CLAUDE CODE ADVANCED COURSE — 3 HOURS",
  "CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)",
  "4 Claude Code Hacks To Make Any Website Look Pro",
  "12 Ways to Fix Context in Claude Code",
  "27 Claude Code TIPS",
  "Automated Faceless Shorts with AI",
  "Claude Cowork Marketing",
  "From Zero to RAG Agent",
  "Insane Youtube Automations",
  "n8n Blogging Automation: Generate SEO Blogs in Minutes",
  "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)",
  "Never label gmail emails again",
  "Alternatives to N8N in 2026",
  "VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity",
  "Agentic Workflow for Businesses",
)

AI_CONTENT_COURSE_TITLES: tuple[str, ...] = (
  "Beginners Guide to Faceless YouTube in 2026 (3 hours)",
  "New YouTube Policy ENDS These Faceless YouTube Channels",
  "Start YouTube Automation in 2026 (Step By Step) NO FACE",
  "Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)",
  "Build a VIRAL AI Movie Channel Using Only AI Tools",
  "Create Viral High RPM Finance Videos Using AI (Full Blueprint)",
  "Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)",
  "Build a Viral AI Influencer (AI Instagram Models)",
  "Make a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)",
  "Build a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)",
  "Use AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)",
  "Clone a VIRAL 3D Documentary Channel Using AI (Full Course)",
  "Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)",
  "Build a Viral Universe Documentary Channel Using Only AI (Step by Step!)",
  "ACTUALLY Go Viral",
  "50 Easy Faceless Niches",
  "Create 1,000 YouTube Shorts Using FREE AI - Free Auto Shorts in Bulk",
  "Crack The NEW Algorithm",
  "These Faceless YouTube Niches Are Now BANNED",
  "Write Faceless YouTube Scripts That Get 100s Of Millions Of Views",
  "The Smart Way to Build a Faceless Finance Channel",
  "New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)",
  "Create Motion Graphics videos in MINUTES with AI",
  "Viral Faceless Stickman POV",
  "The Secret NotebookLM Workflow Every YouTuber Needs!",
  "Create viral 3D documentary videos using ai(FERN 3D STYLE)",
  "Make VIRAL Life Advice Videos Using Only FREE AI Tools",
  "Create Viral inspirational finance Videos with Free AI Tools",
  "Clone ANY YouTube Channel With AI (NotebookLM Hack)",
)

TRADING_COURSE_SLUGS_TITLES: dict[str, str] = {
    **TRADING_MODULE_TITLES,
    **trading_submodule_titles_for_catalog(),
}

_VAULT_COURSE_SLUG_RE = re.compile(r"^(agentic_ai_c|ai_content_c)(\d{2})$")

_INDEXED_PACK_BY_COURSE_PREFIX: dict[str, tuple[str, tuple[str, ...]]] = {
  "agentic_ai_c": ("agentic_ai", AGENTIC_AI_COURSE_TITLES),
  "ai_content_c": ("ai_content_automation", AI_CONTENT_COURSE_TITLES),
}


def _indexed_course_titles(prefix: str, titles: tuple[str, ...]) -> dict[str, str]:
  out: dict[str, str] = {}
  for i, title in enumerate(titles, start=1):
    out[f"{prefix}_c{i:02d}"] = title
  return out


VAULT_COURSE_TITLES: dict[str, str] = {
  **_indexed_course_titles("agentic_ai", AGENTIC_AI_COURSE_TITLES),
  **_indexed_course_titles("ai_content", AI_CONTENT_COURSE_TITLES),
  **TRADING_COURSE_SLUGS_TITLES,
}

VAULT_PACK_SLUGS = frozenset({"agentic_ai", "ai_content_automation", "trading_technical_analysis"})

VAULT_PACK_DISPLAY_TITLES: dict[str, str] = {
    "agentic_ai": "Agentic AI",
    "ai_content_automation": "AI Content Automation",
    "trading_technical_analysis": "Trading Advanced Technical Analysis",
}


def vault_pack_for_module_slug(plan: str) -> str | None:
  """Parent pack slug for a vault module slug, or the pack slug itself."""
  plan = (plan or "").strip().lower()
  if plan in VAULT_PACK_SLUGS:
    return plan
  parent = trading_parent_module_for_slug(plan)
  if parent:
    return "trading_technical_analysis"
  if plan in TRADING_MODULE_SLUGS or plan in TRADING_COURSE_SLUGS_TITLES:
    return "trading_technical_analysis"
  m = _VAULT_COURSE_SLUG_RE.match(plan)
  if not m:
    return None
  pack_entry = _INDEXED_PACK_BY_COURSE_PREFIX.get(m.group(1))
  if pack_entry:
    return pack_entry[0]
  return None


def is_vault_course_plan_slug(plan: str) -> bool:
  plan = (plan or "").strip().lower()
  if plan in VAULT_COURSE_TITLES:
    return True
  return _VAULT_COURSE_SLUG_RE.match(plan) is not None


def vault_parent_module_for_slug(plan: str) -> str | None:
  """Trading submodule → parent module slug (e.g. trading_secrets_01 → trading_master_secrets)."""
  return trading_parent_module_for_slug(plan)


def vault_course_product_title(plan: str) -> str | None:
  plan = (plan or "").strip().lower()
  title = VAULT_COURSE_TITLES.get(plan)
  if title:
    return f"{title} — lifetime access"
  m = _VAULT_COURSE_SLUG_RE.match(plan)
  if not m:
    return None
  prefix_key, num = m.group(1), int(m.group(2))
  pack_entry = _INDEXED_PACK_BY_COURSE_PREFIX.get(prefix_key)
  if pack_entry:
    titles = pack_entry[1]
    if 1 <= num <= len(titles):
      return f"{titles[num - 1]} — lifetime access"
  return None


def vault_course_billing_title(plan: str) -> str | None:
  plan = (plan or "").strip().lower()
  if plan in VAULT_COURSE_TITLES:
    return VAULT_COURSE_TITLES[plan]
  m = _VAULT_COURSE_SLUG_RE.match(plan)
  if not m:
    return None
  prefix_key, num = m.group(1), int(m.group(2))
  pack_entry = _INDEXED_PACK_BY_COURSE_PREFIX.get(prefix_key)
  if pack_entry:
    titles = pack_entry[1]
    if 1 <= num <= len(titles):
      return titles[num - 1]
  return None
