---
id: A-029
tier: A
category: "Data & BI"
kind: workflow
title: "One-prompt BI agent that builds a dashboard from a sentence"
subtitle: "A BI analyst takes 2-10 days per dashboard. An agent over your warehouse does it in 30 seconds with the same KPI definitions."
source: https://www.cybos.ai/cases/A-029
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Founder · head of growth · product manager · any non-analyst"
type: case
version: v0.1
---
# One-prompt BI agent that builds a dashboard from a sentence

> A BI analyst takes 2-10 days per dashboard. An agent over your warehouse does it in 30 seconds with the same KPI definitions.

## What

An agent reads your warehouse + semantic layer + "house-style" rules and assembles a fully-rendered, editable dashboard from one natural-language prompt ("make me a marketing cross-channel dashboard, last 90 days, by source × creative"). The output is a normal BI artifact (filterable, drillable, shareable) — not a chat answer. After the first generation, the user drags, edits, pins; everything they do feeds back into the agent's preferences. One reference deployment operates 100+ live dashboards built this way and eliminated the BI-analyst role internally.

## Why it matters

A BI analyst cycle is typically 2–10 business days: requirements meeting → ticket → SQL → review → iterate → publish. The agent runs the same cycle in 30–90 seconds. That changes who can ask data questions (now: anyone) and how often (now: as a first step rather than a last resort). At one reference deployment, sales conversion +4×, BI-analyst headcount cut to zero.

## End-to-end

1. **Land everything in one analytical DB.** ClickHouse, Snowflake, BigQuery, or DuckDB are all fine. Use CDC where possible. Don't transform — land raw.
2. **Build a thin semantic layer with locked KPI definitions.** dbt + a metrics layer (Cube, MetricFlow, dbt Semantic Layer). The point is: "revenue", "active merchant", "MRR" each have exactly one definition the agent must use.
3. **Write a "house style" file** at `bi/HOUSE-STYLE.md` covering: default time grain, default filters, how to handle nulls, naming, color palette, when to use bar vs. line, what "good" looks like for each role's dashboard.
4. **Expose the warehouse through MCP.** Give the agent a read-only role with row-level security; never raw credentials. Add a `query_warehouse` and `list_tables` MCP tool.
5. **Pick a render target.** Three credible options: (a) Metabase / Superset / Hex via API — agent generates a dashboard JSON; (b) Streamlit / Evidence — agent generates a `.py` or `.md` file and runs it; (c) custom HTML+SQL via vibe-coding (fastest demo, hardest to govern).
6. **Wire the prompt loop.** The agent receives the request, lists the relevant tables, drafts SQL against the semantic layer, validates with a deterministic gate (does the query parse? does it respect RLS? does it return non-zero rows?), renders, and returns a URL.
7. **Capture edits as preferences.** Every manual edit is logged as a "preference delta" file under `bi/preferences/{user}.md`. Agent re-reads next time.
8. **Kill the analyst queue, on purpose.** New analytics requests go to the agent, not Jira. The analyst role morphs into semantic-layer steward.

## Prompts

System prompt fragment for the BI agent:

```
`You build BI dashboards from natural language for a 30–100 person company.

Inputs available:
- semantic layer (canonical metrics in /bi/semantic/*.yml)
- house style (/bi/HOUSE-STYLE.md) — READ FIRST
- per-user preferences (/bi/preferences/{user}.md)
- MCP tools: list_tables, query_warehouse, create_dashboard

Hard rules:
- NEVER write a metric definition; if a metric isn't in /bi/semantic, return [MISSING-METRIC: name].
- ALWAYS use the user's default time grain and currency from their preferences file.
- If a query would scan >10 GB, ask before running.
- Mark every figure with its source query in a footer note.
- Output: a single dashboard URL + a 3-bullet "what I built and why" note.
`
```

End-user prompts that should work after setup:

```
`Marketing dashboard, last 90 days. Show paid channels by source × creative,
spend, CAC, payback. Highlight anything outside last quarter's 1σ band.
`
```

```
`Re-do yesterday's CS dashboard but split by plan tier and exclude internal accounts.
`
```

## Gotchas

- **No semantic layer = drift.** Without locked KPI definitions the agent will invent its own "revenue" and you'll discover three contradictory numbers in the same week. Build the semantic layer before turning the agent loose.
- **Read-only role, not user-credential pass-through.** Don't let the agent run with the user's snowflake creds. Use a scoped MCP role.
- **Don't dump the warehouse schema into context.** Use `list_tables` as a tool call so context stays clean.
- **Treat the agent's first 20 dashboards as throwaway.** They surface gaps in semantic + style. Fix them, then the next 100 are free.

## Variations

- **Lighter:** Read-only over a single Postgres + Streamlit. No semantic layer; just a `metrics.md` file the agent must follow. Ships in two days.
- **Heavier:** Add a deterministic SQL linter, a 24-hour cache, snapshot diffs ("compare yesterday's dashboard to today's"), and a "subscribe to this dashboard" Slack hook.
- **Vertical:** For HIPAA/financial-services workloads, run inference in-VPC and add PII-masking at the semantic layer.

## Tools

- Analytical warehouse (ClickHouse / Snowflake / BigQuery / DuckDB)
- Semantic layer (dbt + Cube / MetricFlow / Hex's semantic layer)
- MCP server exposing `query_warehouse` (read-only, RLS-aware)
- Render target (Metabase API / Superset API / Hex / Evidence / Streamlit / custom HTML)
- Claude Code or Cursor with the MCP wired in
- `bi/HOUSE-STYLE.md` and `bi/semantic/*.yml` committed to repo
