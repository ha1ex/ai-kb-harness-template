---
id: A-037
tier: A
category: "Strategy & leadership"
kind: strategy
title: "Eliminate-role unlock chain — the prerequisite map for replacing a function with agents"
subtitle: "Most role-replacement attempts fail because the knowledge graph isn't dense enough. Map shows what to build first, role by role."
source: https://www.cybos.ai/cases/A-037
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "XL · Half-year+"
for: "Founder · head of function being replaced · head of platform/data · AI transformation lead"
type: case
version: v0.1
---
# Eliminate-role unlock chain — the prerequisite map for replacing a function with agents

> Most role-replacement attempts fail because the knowledge graph isn't dense enough. Map shows what to build first, role by role.

## What

Treats "eliminate a role" as the *output* of a knowledge-coverage program, not as a HR decision. At one reference deployment, four roles were fully removed over ~18 months: BI analysts, content managers, pure project managers, and all frontend engineers. None of the eliminations happened by "trying AI"; each was preceded by a specific knowledge-graph and tooling buildout that made the role's daily work expressible as a one-prompt request. This case formalises the precondition map so a startup can predict which role they can replace next, and what they have to build first.

The strategic upper bound, articulated by one operator and now an open question across the corpus: **can a single founder absorb a 300-person company's context and run it solo?** ("Where is the limit? Can one person eat a 300-person company with agents and remain solo-founder? Not yet known. I'm researching.") The thesis: rather than "automate the org" by adding helpers, ingest all of the company's context into the founder's personal-OS, become the conductor of the token stream, then decide who is actually needed to remain. Reference paper cited by the operator: the difference between AI-as-helper (boosts human productivity) vs AI-as-replacement (replaces human entirely) — the operator argues we are in the replacement era for white-collar work.

## Why it matters

At the reference agency: headcount halved while growth accelerated; sales conversion 4×; almost every internal metric trending up. The structural prize is not the headcount line — it is that the *replacement asset* (the dense graph + agentic skills) compounds across every other case in this playbook. The cost is real: you cannot ship this without ~12 months of deep ingestion (token metabolism, MCP data layer, CLAUDE.md hierarchy, doc-as-code discipline) first.

Newer data points from the 2026 cohort, across different operator profiles:

- **A small franchise founder, time-series across 2 weeks:** cleaned up ~25% of headcount in week 1 (including 2 department heads who could not lead the AI transformation), then continued cleanup driven by AI-readiness assessment over the following weeks, no impulsive decisions. Cadence: pre-paid AI subscriptions for everyone + 2-hour weekly mandatory share-out as the observable surface for "who can lead vs who can't."
- **One operator at a mid-size cosmetics retailer:** during one 3-week cohort, built (a) a rhizome / 17-hub architecture (see companion case) and (b) used the "transcripts-into-context" workflow to surface a CEO-fit insight; **fired the CEO mid-cohort** on that basis. This is a separate operator from the smaller cosmetics founder below — the audit log clearly distinguishes them. Last day of the cohort = last day of the CEO.
- **A mid-size cosmetics retailer (different operator):** the largest concrete planned cut in the 2026 cohort — **planned office headcount cut of >50%**. Path: kill the legacy task tracker, replace work with microservices (see companion case), production-floor employees pulling themselves through by automating planning-adjacent ops. <10% direct refusal rate; the rest opt-in or amicably exit with severance.

These data points are not blueprints — each operator's situation differs — but together they map the shape of the curve: a small operator can cut a quarter of headcount in weeks; a mid-size operator can plan a halving in months; a larger operator can plan 4 entire role categories over 18 months. The graph-coverage prerequisite map below tells you which cut is realistic for your stage.

## End-to-end

1. **Frontend engineers (replaced by every product person coding their own UI)**

- **Graph coverage required:** product taxonomy as a first-class sub-graph — every feature with code location, route, component name, prop schema, and which SQL powers it. At the reference agency this was a 1–2 month build run by two engineers after the product taxonomy itself was already in the graph.
- **Tooling required:** vibe-coding stack standardised across the company (Tailwind via CDN, shadcn/ui registry, one approved chart library, one approved deploy target — see the vibe-coding playbook). Hooks/agent rules block edits outside the design system.
- **What stays manual:** design-system updates, accessibility audits, one shared component library maintained by ~1 staff engineer.
- **Demo proof:** "ship a small feature from a one-paragraph PRD in under 60 minutes, including deploy." When 5+ non-engineers can do this reliably, the frontend role is done.

1. **Content managers (replaced by a content-voice writer with multi-channel publishing skill)**

- **Graph coverage required:** brand voice as `brand-book.md` + 10 sample posts per channel + ICP definitions + style guard-rails (banned words, fact-check policy). Plus: every prior post indexed so the agent can avoid repeats and link backwards.
- **Tooling required:** a `content-voice` skill that takes (topic, channel, optional folk/gonzo modifier), calls a web-search MCP for fact-check, and writes to `articles/<channel>/` per naming convention. Auto-banner skill on the same brand file. Publishing guardrail: never post directly to public channel, always to a draft area first.
- **What stays manual:** annual brand-voice review; sensitive launch announcements; founder thought-leadership.
- **Demo proof:** "produce a 600-word post in our voice on topic X, with two fact-checks and a matching banner, in 4 minutes." Five demos pass → role is replaceable.

1. **BI analysts (replaced by a natural-language-to-dashboard agent)**

- **Graph coverage required:** an MCP data layer over the warehouse: every entity defined once (customer, account, MQL, opportunity), every metric named and pointed at exactly one SQL definition (semantic layer locked), every dashboard composable from named components. Reference agency reports "over 100 dashboards" built this way after the semantic layer was tight.
- **Tooling required:** warehouse (ClickHouse / Snowflake / BigQuery), semantic layer (dbt or equivalent with column-level lineage), MCP shim exposing the layer to agents, dashboard component library, and a "natural-language analytics" skill that composes dashboards on prompt. Row-level security on the warehouse so the agent never sees data it shouldn't.
- **What stays manual:** semantic-layer authorship, new-metric proposals, regulatory reporting where evidence chains must be human-signed.
- **Demo proof:** "build me a cross-channel attribution dashboard with cohort retention, save to the marketing folder" → 30 seconds to render → tweakable in BI fashion. Five such demos across three departments → BI analyst role retired.

1. **Pure PMs (replaced by GitHub Issues as agent memory + a workflow agent that runs the project)**

- **Graph coverage required:** every initiative cataloged with the same 12-field schema (problem, solution, impact, complexity, owner, type, cost, revenue effect, FTE effect, sources, related, entity); every meeting transcribed, tagged, and auto-routed into per-project status cards; the head of the function maintains a directing prompt that produces a daily priority list per project.
- **Tooling required:** transcript pipeline (Whisper / Deepgram or a local ASR), per-project status-card workflow, the "AI Overlord" directing prompt that emits per-project weekly priorities, GitHub Issues (or equivalent) as durable agent state with one issue per workstream so context survives across sessions.
- **What stays manual:** quarterly strategic re-prioritisation; cross-team escalation calls; the founder's weekly review of the directing prompt itself.
- **Demo proof:** "show me each project's top three actions for this week, the blocker, the cost of inattention, and the next deliverable" — produced from the graph, citing source transcripts. When the agent's output matches what a senior PM would have written, the role is done.

1. **Department heads who cannot lead an AI transformation**

- **Graph coverage required:** this is not a graph-coverage decision. It is a transformation-leadership decision, made on observable behaviour over weeks (do they show up to the weekly cadence; do they bring real wins to share; do they enable their team to bring wins).
- **Tooling required:** a transparent cadence (see the cadence variants in A-039). The 2-hour weekly mandatory share-out at one small franchise reference site explicitly surfaced 2 department heads who could not lead the change — they were laid off after weeks of observed behaviour, no impulsive decisions.
- **What stays manual:** the conversation itself; the severance terms.
- **Demo proof:** by the time you have enough evidence to make the call, the call is obvious.

1. **Inverse case — roles that did NOT get eliminated**

- CFO / Finance lead: financial domain still hard for agents (regulatory, signatures, reconciliation). Headcount unchanged.
- Customer Success leads (humans on accounts ≥ a revenue threshold): explicitly kept human because relationship is the value.
- Designers (for the last 2 pixels): explicit "keep humans for taste" pocket.
- Bookkeepers / tax-facing accountants: regulator-side dependency makes the replacement risk asymmetric. Wait for tooling.
- Customer-facing "warm contact" layer: one operator's framing — "AI as exoskeleton; humans as vibe-service" — explicitly carves out the customer-facing layer that stays human, with a lowered qualification bar because AI does the under-the-hood work. The role survives, with smaller payroll cost per seat.
- Use this inverse list to inoculate the org against the "AI replaces everyone" panic.

## Prompts

System prompt fragment for the AI Overlord directing prompt (the replacement-asset for pure PMs):

```
`You are the head of [function] reviewing all [N] active projects for this week.

Inputs you can read:
- Per-project status cards in Projects/Status-Projects/Client-*.md
- Latest team-status-review transcript in Projects/Transcripts/
- All Slack/Telegram threads per project
- Task tracker comments
- Integration data for each project

For each project produce, in priority order:
- Top 3 actions the human owner should take this week
- The current blocker and whose desk it sits on
- Cost-of-inattention: what will degrade if no action this week
- Cite specific evidence (transcript timestamp, ticket ID, message link)

Priority formula: urgency × importance × business value × cost of attention.
Confirm each suggestion is grounded in the source; never invent a task.
`
```

Per-feature taxonomy node schema (the unlock for frontend replacement):

```
`type: feature
slug: smart-upsell-pos
title: Smart Upsell at POS
code_locations:
 - apps/web/src/pos/upsell/*
 - apps/api/src/upsell/*
routes: [/pos/checkout/upsell]
components: [UpsellSheet, UpsellSlot, UpsellTracker]
sql_views: [v_upsell_attempts, v_upsell_conversion]
canonical_doc: Docs/Product/features/smart-upsell-pos.md
owner_role: product-lead
status: shipped
`
```

"Eat the 300-person company alone" personal-OS skeleton (paste into a private repo's root `AGENTS.md`):

```
``
```

## Gotchas

- **Don't lead with the headcount story.** Internally and externally, lead with capability ("any product person can ship their own feature") and let the org reshape itself. Leading with headcount triggers immune response and people start hiding AI usage from leadership.
- **Don't replace a role until the agent beats the median IC three times in a row on independent samples.** Saving one FTE is not worth a 6-month quality regression.
- **Don't skip the inverse list.** Naming the roles you are *not* replacing is the single highest-trust act available. Without it the org assumes everyone is at risk.
- **Don't try to eliminate pure PMs before the transcript pipeline is real.** Without auto-ingested meeting data the directing prompt is fiction.
- **Fire department heads on evidence, not on enthusiasm.** One small franchise reference operator was explicit: 5–6 layoffs across 2 weeks driven by weeks of observable behaviour at a cadence call, no impulsive decisions. The risk of getting this wrong is asymmetric — a wrongly-kept skeptical leader stalls the function; a wrongly-fired capable leader poisons the next round of layoffs.
- **The "300-person company alone" thesis is unproven.** One operator is researching the limit live. Don't aim for it as a destination; treat it as a horizon that informs which prerequisites you build first. The compounding asset (the dense graph + personal-OS) is real regardless of whether the 300-person limit is reachable.
- **Champions are a phase, not a finale.** Multiple operators converged: Champions help bootstrap, but the goal is to *need fewer of them*, not more. Long-running Champion programs are a tell that the underlying graph isn't dense yet.
- **Don't conflate "automate the role" with "replace the human."** The exoskeleton + vibe-service model carves out a path where the human role survives at a lower qualification bar with smaller payroll cost; don't default-eliminate when a vibe-service redesign is the better answer.

## Tools

- Token-metabolism ingestion pipeline (every Slack / Gong / GitHub / Notion / transcript event flowing into a single store with surprise/contradiction detection). This is the prerequisite of prerequisites.
- MCP data layer over the warehouse with row-level security.
- CLAUDE.md / AGENTS.md three-tier hierarchy installed (global / vault / project).
- Naming convention enforced (`{project} {type} description – yyyy-mm-dd.md`).
- One staff engineer who maintains the brand-book + design system + semantic layer (this role expands as the others shrink).
- (For the "eat 300-ppl alone" thesis variant) a personal-OS with always-on web terminal for session continuity between laptop and phone; a single-inbox view regenerated nightly.
- Faith in the model as a hiring filter — engineers who over-decompose tasks for the agent are the new bottleneck.
