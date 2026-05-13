# Syndicate project — AI & “agents”: client overview

This document explains **what AI does in the Syndicate codebase**, **where it lives**, and how to describe it accurately to a client or stakeholder.

---

## 1) Important vocabulary (avoid confusion)

| Term | Meaning in *this* project |
|------|---------------------------|
| **“Agent” (marketing / UX)** | Often means **Syndicate Mode**: AI-generated **daily missions**, quotes, and scoring help. It is **not** a separate autonomous robot process in most cases. |
| **“Evaluation agent”** | A **single LLM call** (OpenAI) that returns **structured JSON** — e.g. “is this mission response valid?” or “attestation + suggestions”. It is **one step** in a server workflow, not a multi-tool loop. |
| **“Ingest agent”** | Doc comment in code: **document → structured `MindsetKnowledge`** (mindsets, patterns, habits) via OpenAI. Again: **orchestrated pipeline**, not a roaming agent. |
| **IDE agents (Cursor, etc.)** | Used **while building** the product (search repo, edit files, run tests). These **do not ship inside** the Syndicate app and are **not stored in this repository** as runnable agents. |

**One sentence you can say to a client:**  
> “Syndicate uses **OpenAI (GPT-family, configurable model)** for **structured generation and validation** — missions, quotes, document ingest, membership content helpers, and quiz reporting — behind our **Django API** and **Next.js** dashboard.”

---

## 2) Central configuration (product AI)

| Item | Location | Notes |
|------|----------|--------|
| API key | Server environment: `OPENAI_API_KEY` | Loaded in `Backend/syndicate_backend/settings.py`. **Never commit real keys** to git; use Railway / `.env` locally only. |
| Model | `OPENAI_MODEL` (default `gpt-4o-mini` in settings) | Same file as above. |
| Shared OpenAI wrapper | `Backend/api/services/openai_client.py` | **`chat_json()`** — system + user messages, **`response_format: json_object`**, parses JSON. Most features call into here. |
| Prompts (system strings) | `Backend/api/services/prompts.py` (imported from `openai_client`) | Referenced as `INGEST_SYSTEM`, `MISSION_RESPONSE_VALIDATION_SYSTEM`, etc. |

---

## 3) Product features that use the LLM (by module)

### A) Document ingest → “mindset knowledge” (feeds missions)

| What | OpenAI extracts structured **mindsets / patterns / habits / benefits** from uploaded document text. |
|------|--------------------------------------------------------------------------------------------------------|
| **Backend** | `Backend/api/views.py` — uses `extract_mindsets_from_document`, `normalize_mindset_ingest_payload`. |
| **Core logic** | `Backend/api/services/openai_client.py` — `extract_mindsets_from_document`, `normalize_mindset_ingest_payload`. |
| **Downstream** | `Backend/apps/challenges/services.py` — mission generation reads **`MindsetKnowledge.payload`** (comment: “ingest agent”, meaning **this pipeline**, not a second codebase). |

**Client line:**  
> “Uploaded operator doctrine is **normalized into structured mindset data**, which **personalizes** daily challenge generation.”

---

### B) Syndicate Mode / Challenges — missions, quotes, validation, attestation

| Capability | Role | Key files |
|------------|------|-----------|
| **Generate missions** (mood, category, batches, daily waves) | OpenAI returns **JSON challenge payloads**; server validates / dedupes. | `Backend/apps/challenges/services.py` (orchestration), `Backend/api/services/openai_client.py` (`generate_challenge_for_mood`, batch helpers, etc.) |
| **Score user mission response** | **Step 1 — “evaluation agent”:** `evaluate_mission_validity_with_agent` → `validate_user_mission_response_for_scoring` → strict **`is_valid` + `reason`**. Invalid → no points. | `Backend/apps/challenges/services.py` (`evaluate_mission_validity_with_agent`, `score_mission_response_after_validation`), `Backend/api/services/openai_client.py` |
| **Numeric score** | **Deterministic** heuristics (relevance, length, time bonus, etc.) **after** LLM says valid. | `score_mission_response_after_validation` in `services.py` |
| **Attestation (optional)** | Second LLM pass: qualitative **verdict + checks + suggestions** (JSON). | `attest_user_mission_response`, `enrich_mission_score_with_agent_attestation` in same modules |
| **Daily “agent quote”** | One cached **AI brief** per user per calendar day. | `Backend/apps/challenges/agent_quote_view.py` (`GET …/agent_quote/`), `generate_agent_daily_quote` in `openai_client.py` |
| **HTTP surface** | REST under `/api/challenges/` | `Backend/apps/challenges/urls.py` (includes `agent_quote/`, `generate/`, `score_response/`, etc.) |
| **Dashboard UI** | Missions board, limits, attestation UI, errors when key missing | `Frontend-Dashboard/src/components/SyndicateAiChallengePanel.tsx` |
| **Frontend API client** | Typed fetch to challenges API | `Frontend-Dashboard/src/app/challenges/services/challengesApi.ts` |

**Client line:**  
> “When a user completes a mission, an **LLM gate** checks the response is on-brief; only then do **rules-based scoring** and optional **quality attestation** run.”

---

### C) Membership hub — articles & keywords

| Capability | Key files |
|------------|-----------|
| **Generate membership article** (body from keywords / template) | `Backend/apps/membership/views.py` → `generate_membership_article` in `openai_client.py` |
| **Extract keywords from documents** (admin / tooling) | `Backend/apps/membership/keyword_dataset.py` → `extract_membership_keywords_from_document` in `openai_client.py` |
| **Auto brief in UI** (optional generation flow) | `Frontend-Dashboard/src/components/membership/MembershipContentHub.tsx` (e.g. `autoGenerateBrief`) |

---

### D) Quiz funnel (“Syn diagnosis” style product)

| Capability | Key files |
|------------|-----------|
| **AI report generation** for quiz flow | `Backend/apps/quiz_funnel/ai_service.py` (`generate_ai_report`, OpenAI client) |
| **HTTP** | `Backend/apps/quiz_funnel/views.py` calls `generate_ai_report` |
| **Public UI** | `Frontend-Dashboard/src/app/quiz/`, `Frontend-Dashboard/src/app/quiz/result/` |

---

## 4) What is **not** “an agent inside the repo”

| Item | Reality |
|------|---------|
| **Cursor / Copilot “Agent mode”** | Development tool; may use **multi-step tool loops** on *your laptop*, not shipped as part of Syndicate’s runtime. |
| **`.cursor/` rules in the repo** | This clone may **not** include team Cursor config; often lives per developer. |
| **Autonomous multi-agent frameworks** (LangGraph, CrewAI, etc.) | **Not** identified as dependencies for the AI flows above; the stack is **Django + OpenAI SDK + JSON contracts**. |

---

## 5) Architecture diagram (conceptual)

```text
[ Next.js dashboard ]
        |
        v
[ Django REST: /api/challenges/* , membership, quiz_funnel, ingest ]
        |
        +--> OpenAI chat completions (JSON mode)
        |         |
        |         +-- Mission text / batches / quote
        |         +-- Validation + attestation
        |         +-- Mindset ingest
        |         +-- Membership article / keywords
        |         +-- Quiz AI report
        |
        +--> Postgres / models (e.g. MindsetKnowledge, challenges, quotes)
```

---

## 6) Security & operations checklist (for clients / IT)

1. **`OPENAI_API_KEY`** — server-only; rotate if leaked; never embed in frontend bundles.  
2. **`OPENAI_MODEL`** — pin per environment (cost vs quality).  
3. **Fallbacks** — UI shows messages when key missing (e.g. attestation unavailable); scoring paths document `OPENAI_API_KEY` dependency.  
4. **Logging** — ensure prompts/responses with **PII** are not logged verbatim in production.  
5. **Rate limits** — protect generate/score endpoints at gateway or Django level for abuse.

---

## 7) Single table: “If the client asks where X is…”

| Client question | Point them here |
|-----------------|-----------------|
| Where are missions generated? | `Backend/apps/challenges/services.py` + `openai_client.py` |
| Where is mission **validation**? | `evaluate_mission_validity_with_agent` in `challenges/services.py` → `validate_user_mission_response_for_scoring` in `openai_client.py` |
| Where is the **daily AI quote**? | `GET /api/challenges/agent_quote/` → `agent_quote_view.py` + `generate_agent_daily_quote` |
| Where does **document ingest** run? | `Backend/api/views.py` + `extract_mindsets_from_document` |
| Where is **membership AI writing**? | `membership/views.py` + `generate_membership_article` |
| Where is **quiz AI**? | `quiz_funnel/ai_service.py` |
| What does the **user** see for missions? | `SyndicateAiChallengePanel.tsx` |

---

## 8) Further reading inside the repo

- High-level flow (sections on challenges / membership): `PROJECT_FULL_DOCUMENTATION.md`  
- Railway env hints: `Backend/docs/RAILWAY_DEPLOYMENT.md` (mentions OpenAI for mission AI)

---

*Document generated from repository analysis. If you add new LLM features, append a row to §7 and link the new module here.*
