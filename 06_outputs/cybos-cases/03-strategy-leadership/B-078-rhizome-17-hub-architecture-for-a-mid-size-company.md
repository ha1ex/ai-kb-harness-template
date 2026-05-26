---
id: B-078
tier: B
category: "Strategy & leadership"
kind: pattern
title: "Rhizome / 17-hub architecture for a mid-size company"
subtitle: "Monolith-rewrite IT projects consume the budget and ship nothing. 17 small hubs with declared inputs/outputs let one go live per week."
source: https://www.cybos.ai/cases/B-078
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "Founder + a designated \"Integration Engineer\" role"
type: case
version: v0.1
---
# Rhizome / 17-hub architecture for a mid-size company

> Monolith-rewrite IT projects consume the budget and ship nothing. 17 small hubs with declared inputs/outputs let one go live per week.

## What

Model the company as three layers: a top strategic layer, a thin presentation layer at the bottom, and in the middle a rhizome of ~17 micro-service "hubs", each with an explicit owner, declared `data_in`, declared `data_out`, and a single one-page contract. Build hub MVPs statically the first week (no live data) to calibrate the IO shape with humans. Then connect Postgres / MS SQL one side at a time as each hub's owner accepts the contract.

## Why it matters

For a mid-size operator, going hub-by-hub avoids the failed "monolith rewrite" anti-pattern that consumed prior IT budgets. The 17-hub map also surfaces every accidental department fiefdom: a hub whose `data_in` no one upstream is willing to produce is a department that has stopped delivering value. One mid-size retailer used the resulting map to fire its CEO mid-cohort because the hub-graph showed the role's outputs went nowhere.

## End-to-end

1. Run the transcripts-into-context pipeline (see [new-N13-02]) on the last 6 months of leadership meetings. Output: candidate process list.
2. Cluster into ~15–20 hubs. Each hub gets a one-pager: purpose, owner, `data_in`, `data_out`, SLA, current manual cost.
3. Hand the architect role to an "Integration Engineer" — not a CIO, not a consultancy; one operator who owns the graph end-to-end.
4. Week 1: build every hub statically (mock data, fixed outputs). Walk each hub's owner through it; iterate the IO contract until owner says "yes, that's what I produce / consume."
5. Week 2+: plug Postgres / MS SQL / ERP one side at a time. The hub does the read; never modify the source system. (See [new-N14-05].)
6. Add a top-level dashboard listing every hub's last-update timestamp and SLA compliance.
7. Cull / merge hubs quarterly; the graph is a living document.

## Gotchas

- Don't start with live data. Static-first lets you fight the IO contract argument before integration costs lock you in. Skipping this step is how a 6-week plan becomes a 6-month plan.

## Tools

- Claude Code or Codex for the static MVPs
- Postgres / MS SQL (or whatever ERP you wrap)
- One whiteboard or Mermaid diagram for the hub map
