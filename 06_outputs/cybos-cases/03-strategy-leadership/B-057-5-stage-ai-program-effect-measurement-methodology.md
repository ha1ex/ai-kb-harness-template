---
id: B-057
tier: B
category: "Strategy & leadership"
kind: framework
title: "5-stage AI program effect measurement methodology"
subtitle: "\"What's the ROI of this AI thing?\" gets answered with model accuracy. Measure financial increment vs. the best non-AI alternative instead."
source: https://www.cybos.ai/cases/B-057
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "finance · head of transformation · AI office"
type: case
version: v0.1
---
# 5-stage AI program effect measurement methodology

> "What's the ROI of this AI thing?" gets answered with model accuracy. Measure financial increment vs. the best non-AI alternative instead.

## What

A measurement framework that values AI initiatives by the financial increment vs. the best non-AI alternative, not by model accuracy or any other technical metric. Five stages — business hypothesis → initial assessment → pilot → post-pilot assessment → monitoring — each with an explicit financial check.

## Why it matters

The single cleanest answer to "but what's the ROI of this AI thing?" Three sources of value get separated explicitly so they don't double-count or get confused:

1. **Revenue / AUM growth or retention** (e.g., churn-risk cases that retained billions in AUM).
2. **Opex / FTE reduction** (e.g., the internal chat platform saving tens of millions annually via 1–5 hours/week per user).
3. **Operational risk reduction** (e.g., call QA coverage rising from 3% to 100%, fewer accounting errors).

A large wealth manager applied this methodology and reported a combined nine-figure annual effect target for the year — the framework forced realistic estimates, not optimistic vendor math.

## End-to-end

1. **For each proposed initiative, name the best non-AI alternative.** "Do nothing" counts; "hire 2 people" counts; "buy an off-the-shelf tool" counts.
2. **Compute the delta in money.** Revenue uplift, opex saved, or risk-exposure avoided.
3. **At pilot start, set a stop-loss.** If the delta isn't visible within N weeks, kill the pilot.
4. **At post-pilot, re-compute the delta** against the same alternative; if it's smaller than projected, decide explicitly: scale-back, kill, or pivot.
5. **Monitor in production** with a single dashboard line per initiative: "incremental value YTD."
6. **Roll up at the program level** by impact type (revenue / opex / risk), not by department, to avoid double-counting.

## Gotchas

- Vendor estimates and internal pitches both inflate. Force the "what's the alternative" answer in writing before any approval.

## Variations

- **Shared KB of finished pilots** — pair the measurement framework with a one-page intake form, scoring rubric, 2–4-week pilot window, binary go/no-go decision, and a shared knowledge base of finished pilots. Closes the loop between "AI idea proposed" and "result documented."

## Tools

- A simple per-initiative spreadsheet with `alternative_cost, ai_cost, delta, status`
- Quarterly governance cadence
