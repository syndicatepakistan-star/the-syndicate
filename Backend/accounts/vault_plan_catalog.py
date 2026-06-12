"""Vault pack + individual course plan slugs for Stripe billing (sync indices with frontend vaultPackCatalog.ts)."""

from __future__ import annotations

import re

AGENTIC_AI_COURSE_TITLES: tuple[str, ...] = (
  "Build a Blog Writing Agent With N8N",
  "Build a WhatsApp Agent with n8n",
  "Build Apps With secret Claude Code Skill",
  "Claude Code + Consensus = INSANE $50k+ App Ideas",
  "Claude Code is Better at n8n",
  "Claude Code just changed Memory Forever",
  "Claude Cowork Automations",
  "Scrap Any Website with N8N",
  "Set up Google Credentials in n8n",
  "Google Antigravity FULL COURSE 2 HOURS",
  "n8n Tutorial 37 Tips and Tricks (n8n Masterclass)",
  "CLAUDE CODE ADVANCED COURSE — 3 HOURS",
  "CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)",
  "4 Claude Code Hacks To Make Any Website Look 10 by 10",
  "12 Ways to Fix Context in Claude Code",
  "27 Claude Code TIPS",
  "Automated Faceless Shorts with AI",
  "Claude Cowork just changed Marketing Forever",
  "From Zero to RAG Agent",
  "Insane Youtube Automation!",
  "n8n Blogging Automation: Generate SEO Blogs in Minutes",
  "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)",
  "Never label gmail emails again",
  "Stop Learning n8n in 2026...Learn THIS Instead",
  "VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity",
  "Agentic Workflow for Businesses",
)

AI_CONTENT_COURSE_TITLES: tuple[str, ...] = (
  "Beginners Guide to Faceless YouTube in 2026 (3 hours)",
  "New YouTube Policy ENDS Those Faceless YouTube Channels",
  "How to Start YouTube Automation in 2026 (Step By Step) NO FACE | FREE COURSE",
  "How I Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)",
  "How I Built a VIRAL AI Movie Channel Using Only AI Tools",
  "How I Create Viral High RPM Finance Videos Using AI (Full Blueprint)",
  "How I Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)",
  "How I Built a Viral AI Influencer Like Aitana Lopez (AI Instagram Model)",
  "How I Made a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)",
  "This Is How I Built a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)",
  "How I Used AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)",
  "I Cloned a VIRAL 3D Documentary Channel Using AI (Full Course)",
  "How I Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)",
  "How I Built a Viral Universe Documentary Channel Using Only AI (Step by Step!)",
  "I Studied 5,000 Faceless YouTube Videos — Here's How To ACTUALLY Go Viral",
  "50 Easy Faceless Niches Explained in 19 Minutes",
  "Create 1,000 YouTube Shorts in 13 Minutes Using FREE AI — Free Auto Shorts in Bulk",
  "I Studied 70+ Faceless Channels To Crack The NEW Algorithm",
  "WARNING: These Faceless YouTube Niches Are Now BANNED",
  "How I Write Faceless YouTube Scripts That Get 100s Of Millions Of Views",
  "The Smart Way to Build a Faceless Finance Channel (Nick Invests EXPOSED!)",
  "I Found a New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)",
  "How I create Motion Graphics videos in MINUTES with AI",
  "This Viral Faceless Stickman POV Niche Is Dominating Youtube (Full Guide)",
  "The Secret NotebookLM Workflow Every YouTuber Needs!",
  "How to create viral 3D documentary videos using ai (FERN 3D STYLE)",
  "How I Make VIRAL Life Advice Videos Using Only FREE AI Tools (FULL COURSE)",
  "Create Viral inspirational finance Videos with Free AI Tools",
  "Clone ANY YouTube Channel With AI (NotebookLM Hack) | Automation 2.0",
)

TRADING_COURSE_SLUGS_TITLES: dict[str, str] = {
  "trading_scalpel_protocol": "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
  "trading_master_strategies": "Strategies of a Master Trader",
  "trading_master_setups": "Setups of a Master Trader",
  "trading_master_secrets": "Secrets of a Master Trader",
}

_VAULT_COURSE_SLUG_RE = re.compile(r"^(agentic_ai_c|ai_content_c)(\d{2})$")


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


def vault_pack_for_module_slug(plan: str) -> str | None:
  """Parent pack slug for a vault module slug, or the pack slug itself."""
  plan = (plan or "").strip().lower()
  if plan in VAULT_PACK_SLUGS:
    return plan
  if plan in TRADING_COURSE_SLUGS_TITLES:
    return "trading_technical_analysis"
  m = _VAULT_COURSE_SLUG_RE.match(plan)
  if not m:
    return None
  prefix = m.group(1)
  if prefix == "agentic_ai":
    return "agentic_ai"
  if prefix == "ai_content":
    return "ai_content_automation"
  return None


def is_vault_course_plan_slug(plan: str) -> bool:
  plan = (plan or "").strip().lower()
  if plan in VAULT_COURSE_TITLES:
    return True
  return _VAULT_COURSE_SLUG_RE.match(plan) is not None


def vault_course_product_title(plan: str) -> str | None:
  plan = (plan or "").strip().lower()
  title = VAULT_COURSE_TITLES.get(plan)
  if title:
    return f"{title} — lifetime access"
  m = _VAULT_COURSE_SLUG_RE.match(plan)
  if not m:
    return None
  prefix, num = m.group(1), int(m.group(2))
  if prefix == "agentic_ai" and 1 <= num <= len(AGENTIC_AI_COURSE_TITLES):
    return f"{AGENTIC_AI_COURSE_TITLES[num - 1]} — lifetime access"
  if prefix == "ai_content" and 1 <= num <= len(AI_CONTENT_COURSE_TITLES):
    return f"{AI_CONTENT_COURSE_TITLES[num - 1]} — lifetime access"
  return None


def vault_course_billing_title(plan: str) -> str | None:
  plan = (plan or "").strip().lower()
  if plan in VAULT_COURSE_TITLES:
    return VAULT_COURSE_TITLES[plan]
  m = _VAULT_COURSE_SLUG_RE.match(plan)
  if not m:
    return None
  prefix, num = m.group(1), int(m.group(2))
  if prefix == "agentic_ai" and 1 <= num <= len(AGENTIC_AI_COURSE_TITLES):
    return AGENTIC_AI_COURSE_TITLES[num - 1]
  if prefix == "ai_content" and 1 <= num <= len(AI_CONTENT_COURSE_TITLES):
    return AI_CONTENT_COURSE_TITLES[num - 1]
  return None
