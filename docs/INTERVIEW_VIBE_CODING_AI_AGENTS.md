# Interview prep: vibe coding, AI tools, LLMs & agents

Use this as a **cheat sheet**: what to say in ~2–5 minutes per topic, plus **optional files** from this repo to open if they ask for a concrete example.

---

## 1. “We work with vibe coding” — what to say

**One-liner:**  
Vibe coding is building software **fast** by staying in flow: you describe intent in natural language, the AI proposes code, and you **review, run, and tighten** until it matches reality (tests, UX, security).

**What to emphasize (professional framing):**

| Say this | Avoid sounding like |
|----------|---------------------|
| You still own **architecture, naming, and edge cases** | “The AI writes everything” |
| You use AI for **boilerplate, refactors, exploration** | “We don’t read code” |
| You validate with **TypeScript, lint, manual QA, prod logs** | “It compiles so it’s fine” |
| You keep **small PRs** and clear commits | One giant unreviewed dump |

**If they ask “risks?”**  
Hallucinated APIs, subtle security bugs, over-abstraction, and **context limits** (the model “forgets” earlier decisions unless you repeat or document them).

**Optional file to show (process, not magic):**  
- Any PR or commit where you **iterated** (e.g. membership / our-methods UI). Say: *“Here’s intent → first pass → fix after running in browser.”*

---

## 2. “We make AI tools” — what to say

**One-liner:**  
An AI tool is usually **(a) a model or API**, **(b) orchestration** (when to call what), **(c) guardrails** (auth, rate limits, PII), and **(d) UX** (streaming, errors, loading).

**Stack they care about:**

1. **Input** — user prompt, documents, UI state.  
2. **Retrieval (optional)** — RAG: embeddings + vector DB + chunking.  
3. **Model** — hosted LLM (OpenAI, Anthropic, etc.) or self-hosted.  
4. **Tools** — HTTP, DB, search, “run this function” — the model picks or you route.  
5. **Output** — streamed tokens, structured JSON, UI updates.

**Optional files in *this* repo (product + integration, not a generic chatbot):**

| File | What to say when you open it |
|------|------------------------------|
| `Frontend-Dashboard/src/components/membership/MembershipOfferLanding.tsx` | “**Client UX**: checkout CTA, error handling, typed API calls — AI-assisted UI work, human-reviewed.” |
| `Frontend-Dashboard/src/app/our-methods/page.tsx` | “**RSC + presentation**: server-safe helpers, no client `cn` where it breaks — shows we catch framework constraints.” |
| `Frontend-Dashboard/src/components/NavApp.tsx` | “**Routing map**: quiz vs programs vs membership — how product surfaces connect.” |
| `Frontend-Dashboard/src/app/membership/page.tsx` | “**Page shell**: video background, layout — thin page, heavy component.” |

If the role is **backend AI**: point to any `fetch` to `/api/...` and say you’d walk through **request validation, auth, idempotency**, even if the LLM isn’t in this file.

---

## 3. “How does an LLM work?” — 60–90 second answer

**Script (memorize the shape, not every word):**

1. **Training (offline, huge):** The model sees enormous text and learns **statistics of language** — which tokens tend to follow which (transformer attention + feed-forward layers). It is **not** a database of facts; it’s a **next-token predictor** compressed into weights.

2. **Inference (online, your app):** You give a **context window** (system + user + tool results). The model outputs **one token (or chunk) at a time**, then feeds that back in until stop criteria.

3. **Why it feels smart:** It has seen many patterns (code, docs, dialogue). **Emergent** behavior: reasoning-like steps appear without explicit “if reasoning” code — but it’s still **probabilistic**.

4. **Hard limits:**  
   - Can **confabulate** (plausible wrong).  
   - **Stale** after training cutoff unless tools/RAG.  
   - **Context length** — long chats get summarized or truncated.  
   - **No true execution** until you add tools or your app runs code.

**One diagram in words:**  
`Prompt + context → Transformer blocks → probability over next token → sample → append → repeat`

---

## 4. “Explain agents” — clear definition + demo story

**Definition:**  
An **agent** is a loop: **LLM → plan or act → tool(s) → observation → LLM again**, until a goal is met or a step cap is hit. The “brain” is still the LLM; the **tools** give it eyes and hands (search, DB, run tests, file edits).

**Contrast:**

| Pattern | What it is |
|---------|------------|
| **Single-shot** | One prompt → one answer. |
| **RAG** | Retrieve docs → answer grounded in chunks. |
| **Agent** | Multiple steps; model **decides** next tool or next subgoal. |
| **Workflow (fixed)** | You code the graph; LLM only fills slots — more predictable for prod. |

**What to say about “your” agents (e.g. Cursor / internal):**  
- **Planner** proposes steps.  
- **Tools** are bounded (read file, grep, terminal, browser).  
- **Human** approves risky actions in many setups.  
- **Evaluation**: did the task complete? diff correct? tests green?

**Optional demo (no secret sauce required):**  
Open **Cursor**: show **Agent** vs **Ask**, mention **tools** (codebase search, terminal). Say: *“The agent is the loop; the model proposes tool calls; the IDE enforces permissions.”*

**If they want code-level agent pattern (pseudocode):**

```text
messages = [system, user_goal]
while not done and steps < MAX:
    response = llm(messages, tools=TOOL_SCHEMA)
    if response.tool_calls:
        for call in response.tool_calls:
            result = run_tool(call)
            messages.append(tool_result(result))
    else:
        return response.text
```

---

## 5. “Vibe coding + AI tools” — one tight story (30 seconds)

> “We use AI to stay in flow on implementation details and exploration, but we keep ownership of architecture and verification. For AI *products*, we treat the LLM as one component: prompts, retrieval, tool contracts, streaming UX, and guardrails — same discipline as any API.”

---

## 6. Questions *you* can ask them

- Do you ship **agents** to users or mostly **RAG + fixed workflows**?  
- How do you **evaluate** quality (human rubric, automated tests on outputs)?  
- **Model hosting**: cloud only or on-prem?  
- **Safety**: PII, prompt injection, tool allowlists?

---

## 7. Checklist before the call

- [ ] One tab: this doc or your notes.  
- [ ] One tab: **GitHub** or IDE with `MembershipOfferLanding.tsx` or `our-methods/page.tsx` ready.  
- [ ] Be able to draw **LLM** (token loop) and **agent** (tool loop) on a whiteboard in **under 1 minute**.  
- [ ] One sentence on **when not to use agents** (latency, cost, determinism, compliance).

---

## 8. “What agents did you use on *this* project?” — honest, strong answer

This repo (**Syndicate / Frontend-Dashboard**) is mainly a **Next.js product UI**. You did **not** have to ship a custom “agent runtime” (ReAct loop in your own backend) to still use **real agents** during development.

### 8.1 Development agents (what you actually used — **Cursor**)

**Say this in one breath:**  
> “For Syndicate I used **Cursor’s Agent mode** — that’s an LLM in a **tool-calling loop**: it searches the repo, opens files, proposes diffs, runs the terminal for `tsc` / `git`, and I **review every change** before merge. Same *architecture* as production agents: plan → act → observe → repeat, with a human in the loop.”

**Concrete examples you can cite from this codebase (truthful story):**

| What happened | Agent “tools” (conceptually) | File(s) to show |
|---------------|-----------------------------|-----------------|
| Membership page: dystopian neon UI, perk cards, header width, text clipping fix | Read/edit TSX, run TypeScript check | `Frontend-Dashboard/src/components/membership/MembershipOfferLanding.tsx`, `Frontend-Dashboard/src/app/membership/page.tsx` |
| Our Methods: chamfered cyber frames, tinted panels, hero CTAs, RSC error (`cn` client-only) | Multi-file edit, **terminal** revealed server/client boundary | `Frontend-Dashboard/src/app/our-methods/page.tsx` |
| Git: commit + push | Terminal `git add` / `commit` / `push` | GitHub history / `git log` |

**Optional: Cursor “skills” (if you use them)**  
Stored under your machine’s **Cursor skills** folder (e.g. `~/.cursor/skills-cursor/...`), not always inside the repo. If you used them, say:  
> “I pulled in **skills** for things like PR hygiene or SDK docs so the agent followed a checklist instead of improvising every time.”

**What *not* to claim unless it’s true:**  
Don’t say “we fine-tuned a model for Syndicate” unless you did. **Vibe coding + Cursor Agent** is already a credible, modern answer.

---

### 8.2 Product vs dev agent (disambiguate in the interview)

| Layer | What it is in *this* project |
|-------|------------------------------|
| **Dev agent** | Cursor (or similar): builds/refactors the **Syndicate** codebase with tools. |
| **Product “AI” surfaces** | The app has rich **dashboard / challenge / quiz** areas (e.g. routes like `/quiz`, heavy panels under `src/components/`). If your team calls something “AI”, clarify whether it’s **rules + UI**, **backend LLM**, or **third-party** — interviewers respect precision. |

If they ask “where is the LLM in the app?” and you’re unsure:  
> “The **shipping surface** I owned here is mostly **frontend integration and UX**; if there’s an LLM behind a feature, it’s likely behind our **API** or a partner integration — I’d walk the request from the component to the handler.”

**Files you can mention as “product surfaces” (open if you know the story):**

| Path | One line |
|------|----------|
| `Frontend-Dashboard/src/app/quiz/page.tsx` | “User-facing **diagnosis / quiz** flow.” |
| `Frontend-Dashboard/src/components/SyndicateAiChallengePanel.tsx` | “Large **in-product** panel — good place to discuss state, API calls, and UX if they dig into ‘AI features’.” |
| `Frontend-Dashboard/src/components/NavApp.tsx` | “**Syn Diagnosis** routes to `/quiz` — product map.” |

---

### 8.3 20-second script: “Show me agents”

1. **Whiteboard / screen:** Draw **tool loop** (same as §4).  
2. **Screen:** Open **Cursor** → one chat where **Agent** ran terminal + edited files (blur secrets).  
3. **Screen:** Open `our-methods/page.tsx` → scroll to **`cx()`** helper — say: *“Agent suggested `cn`; production taught us **RSC can’t call client `cn`** — we replaced with a tiny server-safe `cx`.”* That proves **you** validate, not the model alone.

---

## 9. If they say “we vibe code too” — align vocabulary

| They say | You respond |
|----------|-------------|
| “Vibe coding” | “Fast iteration with AI assist; I still **own** design and correctness.” |
| “AI tools” | “Could mean **IDE agents**, **internal bots**, or **user-facing** LLM features — happy to go deep on whichever you ship.” |
| “Agents” | “I default to **tool-calling loops with guardrails**; for prod I ask about **evals**, **latency**, and **human approval** on destructive tools.” |

---

*Good luck. You don’t need to be a researcher — clarity on tradeoffs and production habits usually wins.*
