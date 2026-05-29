---
id: B-051
tier: B
category: "Data & BI"
kind: workflow
title: "Natural-language analytics over your warehouse"
subtitle: "Every product or marketing decision waits three days for analytics. Type a sentence; dashboard renders against real data in seconds."
source: https://www.cybos.ai/cases/B-051
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "data lead · analyst · product manager · ops lead"
type: case
version: v0.1
---
# Natural-language analytics over your warehouse

> Every product or marketing decision waits three days for analytics. Type a sentence; dashboard renders against real data in seconds.

## What

A marketer (or PM, or founder) types `Make a cross-channel marketing dashboard for last 30 days` into chat. The agent composes SQL against the warehouse, applies the company's stored modeling rules (KPI definitions, naming conventions, currency handling), renders an editable dashboard, and saves it back to the BI catalog. Same surface answers ad-hoc questions: "which creative performed best with iOS users last week?" with citations to source rows.

## Why it matters

One reference deployment runs 100+ dashboards built this way and eliminated the BI-analyst role internally. For a 30–100 person startup, the win is removing the "wait three days for analytics" tax on every product or marketing decision — analysts become coaches who curate the semantic layer instead of running queries.

## End-to-end

1. **Land all sources in one warehouse.** ClickHouse / Snowflake / BigQuery. Don't transform on the way in — store raw + CDC.
2. **Build a semantic layer file.** Markdown or YAML with KPI definitions, table descriptions, join keys, attribution windows. This is the agent's reference, not a metadata server.
3. **Expose the warehouse over MCP.** One tool: `run_sql`. One safety rule: read-only role.
4. **Drop a system prompt that names the semantic file** and instructs the agent to cite row counts and filters in every answer.
5. **Wire a dashboard component library** the agent can compose into (Recharts, Vega, or a BI vendor with API).
6. **Add a stored-opinions block** for SQL style, naming, default lookbacks. Update from feedback.
7. **Pilot with 1 power user**; iterate the semantic file weekly for a month.

## Gotchas

- Hallucinated metrics emerge when the semantic file is fuzzy. KPI drift is silent and lethal — lock canonical definitions and refuse to answer when a metric is ambiguous.

## Tools

- ClickHouse / Snowflake / BigQuery — analytical store
- MCP server with `run_sql` over a read-only role
- A markdown semantic-layer file in the repo
- Claude / GPT with sufficient context for the schema
