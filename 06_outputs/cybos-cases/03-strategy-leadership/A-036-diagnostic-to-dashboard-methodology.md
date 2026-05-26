---
id: A-036
tier: A
category: "Strategy & leadership"
kind: framework
title: "Diagnostic-to-Dashboard methodology"
subtitle: "\"Where do we start with AI?\" turns into 18 months of scattered experiments. 21 interviews; 4-week plan; named owners."
source: https://www.cybos.ai/cases/A-036
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Founder + a small internal or external team of 3–4"
type: case
version: v0.1
---
# Diagnostic-to-Dashboard methodology

> "Where do we start with AI?" turns into 18 months of scattered experiments. 21 interviews; 4-week plan; named owners.

## What

A repeatable consulting product that converts ~21 structured diagnostic interviews into (a) a numbered, sized map of every AI initiative across the company (a large reference deployment cataloged 164 of them worth ~1–2 bn local currency/year), (b) a TOP-17 priority list with verbatim "what to do" playbooks, (c) a McKinsey-style change-management influence-model quadrant, (d) an AI Champions org chart, (e) a 4-week launch plan with named owners and weekly milestones. The deliverable is a single self-contained HTML dashboard with treemap, tabs, and an embedded RAG chatbot over the diagnostic content.

## Why it matters

Most AI transformations start as scattered experiments and stay scattered. This methodology compresses the "where do we start?" phase from months of unstructured exploration into a 4-week named-milestone plan tied to real currency/FTE numbers. The diagnostic itself doubles as buy-in: when 21 employees see their own quotes in the resulting cards, ownership is automatic.

## End-to-end

1. **Interview script.** Build a 60-minute structured interview covering 8 functional domains: Org/leadership, Sales, Customer Service, Engineering, Product, Data/Infra, HR, Processes. For each, ask: top 3 pain points, current AI usage, what would be magical, what's blocked. Record + transcribe.
2. **Run 21 interviews in 4 weeks.** Cross-section: founder + each function head + 1–2 ICs per function. Save each as `2026-mm-dd-{name}.md`. Tag every painful sentence with `<quote function="sales" pain="manual-renewals">…</quote>`.
3. **Card schema — the 12 fields.** Every initiative is a card with: `problem, solution, impact, impactNum, complexity (S/M/L/XL), who, type (cost/revenue/enabler), cost, revenueEffect, fteEffect, sourceData, related`. Plus `entity` (which business unit) and `sourceQuotes` (links to interview lines).
4. **Catalogue all mentioned ideas** as cards. Don't filter yet; aim for 80–200 cards on a 30–100 person company.
5. **Score each function** on a Readiness × Potential 1–10 grid. Surface the obvious "low readiness, high potential = invest" quadrant.
6. **Pick the TOP 17.** Sort by `impactNum / cost`, filtered by complexity ≤ M for first wave. Each TOP card needs a "What to do" — a numbered 6–10 step playbook with named owners.
7. **Build the McKinsey 2×2.** Role Models (sponsor presence) / Understanding & Conviction (propaganda + town halls) / Formal Mechanisms (PR metrics + bonuses + governance) / Skills Development (per-function workshops + champions network). Place 6 transformation initiatives across the four quadrants.
8. **Identify the AI Champions org chart.** 1 Sponsor (exec VP-level), 5–7 Core Champions (build+evangelize), 8–12 Extended Champions (build), 1 external partner (you / the consultancy). Each gets a one-line "fact" describing their AI superpower.
9. **Write the 4-week launch plan.** Three parallel streams: People / Pilots / Education. Each week has 1–2 milestones per stream with named owners. Week-1 milestones must be small enough to land on day 5.
10. **Render the dashboard.** Single static HTML, ~1 MB. Six tabs: Problems, Influence Model, TOP, Map (treemap), AI Office, Next Steps. Embed an "ask anything" chat widget backed by the interview corpus + initiative cards (small RAG).

## Prompts

12-field initiative card schema (YAML):

```
`id: S5
title: "Speech Analytics for Sales"
problem: "150+ sellers, no systematic QA; manager spot-checks 2.5% of calls."
solution: "Whisper/Deepgram transcription via PBX API → AI scores each call
 against checklist (greeting, discovery, objection handling, close) → per-call
 feedback + leaderboard."
impact: "+10–15% conversion"
impactNum: 14000000 # local currency / year, midpoint
complexity: M # S | M | L | XL
who: ["{IT Lead}", "{external partner team}"]
type: revenue # cost | revenue | enabler
cost: 4000000 # local currency
revenueEffect: 14000000
fteEffect: 0 # FTE freed; negative if FTE added
sourceData:
 - file: 2026-02-26-{interviewee-slug}.md
 quote_line: 47
entity: HomeBU # international | HomeBU | shared (anonymized BU labels)
related: ["TOP-4", "CS2"]
status: pilot # backlog | pilot | running | shipped | killed
ownerEmail: owner@your-domain.example
focusDate: 2026-04-09
`
```

Interview script (compressed; ~60 min total):

```
`Block A — Framing (10 min)
1) In 3 sentences, what does your function do?
2) What's the single most painful repeating task on your team right now?
3) What's the biggest one-off project on your plate this quarter?

Block B — Current AI (10 min)
4) Walk me through every AI tool anyone on your team has touched.
5) For each: who pays, how often used, what specifically did it replace?
6) What did you try that failed? Why?

Block C — Magic wand (15 min)
7) If I gave you a perfect agent for one workflow tomorrow, which one?
8) Walk me through the workflow as it is today. Where do you waste time?
9) Which other teams' outputs do you wait on? How long?

Block D — Blockers (10 min)
10) What systems prevent you from using AI today? (Access, data, security)
11) What's the largest unspoken risk you see in this transformation?
12) Which one person on your team would be a champion?

Block E — Numbers (15 min)
13) Your team's headcount, attrition, avg comp.
14) Top 3 metrics you watch weekly. Current values.
15) If you could free 1 FTE on your team via AI, what would they go do?

Closing: "Anything I didn't ask that I should have?"
`
```

`What to do` (action-plan) template for each TOP card:

```
`TOP-X → {ID}: {Title}

Why now: {one sentence tying to a metric or quote}

What to do (action plan):
1) {Step with owner, timeline, dependency}
2)...
6) {6–10 steps total}

Effect: {local currency / yr or $ or FTE} — show the math.
Cost: {local currency or $}.
Owners: {names from the AI Champions roster}.
Timeline: {N weeks/months}.
Risks: {2–3 bullets}.
`
```

## Gotchas

- **Don't skip the quote citation.** Cards without `sourceData` are inert. The reason employees buy in is they recognize their own words.
- **Don't try to size everything precisely.** Order-of-magnitude is fine; spend the precision budget on the TOP-17 only.
- **Don't ship without named owners.** A 4-week plan with anonymous owners is the same as no plan. Get sign-off, in writing, before the dashboard is presented to leadership.
- **Watch for vendor estimate inflation.** A reference card found a vendor quote for on-prem LLM inflated ~4× over the independently re-costed amount. Always re-cost AI infra independently.
- **Don't double-count.** Use the Hard value + Protected value + Execution uplift rollup with an exclusions list for risk/compliance enablers. Otherwise the headline number lies.
- Running an internal AI-readiness pre-survey before any transformation work is tempting and almost always wrong. When the survey reveals shallow usage (it will), the org reads it as "we're not ready," and the top-down program loses political momentum. Better: skip the survey, start solo with one founder + one process, ship a visible artifact in 2 weeks, then survey from a position of demonstrated wins.

## Variations

- **Lighter (30-person startup):** 8 interviews instead of 21; 30–50 cards instead of 164; same dashboard structure, smaller treemap. Two-week timeline.
- **Heavier (enterprise):** Add quarterly re-diagnostics; tie each card to OKR codes; bind the chat widget to the live initiative-tracker so updates flow automatically.
- **Self-serve:** Open-source the dashboard template + interview script + card schema; teams run their own diagnostics. A version of this is already emerging as a consulting product.

## Tools

- A transcription tool (Granola / Krisp / Fireflies) for the interviews
- Claude Code + the documentation skill (#164) to enforce card shape
- A static-site generator or hand-rolled HTML + D3 for the treemap
- A small RAG implementation (Pinecone / pgvector / file-based) for the chat widget
- Optional: an external 2–4 person team (acts as interviewer pool + methodology owner + embedded co-pilot in pilot weeks)
