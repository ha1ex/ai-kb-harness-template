---
id: B-059
tier: B
category: "Strategy & leadership"
kind: strategy
title: "No backlog / no deadlines / focus dates"
subtitle: "Backlogs grow faster than they ship. Once one-prompt changes work, the queue itself is the bottleneck — kill it; commit to start-dates instead."
source: https://www.cybos.ai/cases/B-059
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · COO · head of any team running on agents"
type: case
version: v0.1
---
# No backlog / no deadlines / focus dates

> Backlogs grow faster than they ship. Once one-prompt changes work, the queue itself is the bottleneck — kill it; commit to start-dates instead.

## What

A cultural rule with three components: (1) no backlog — any idea that arrives is faster to ship via an agent right now than to file as a ticket; (2) no deadlines — the team commits to *focus dates* (when work will start) rather than *due dates* (when it must finish); (3) ideas in the founder's head get reduced to zero because the queue is the bottleneck, not the typing.

## Why it matters

One reference deployment runs this as the operating model. The founder reports: "I have no unrealized ideas in my head — never had that in my life." Half the headcount, faster growth, every metric up. The pattern only works once graph density is high enough that one-prompt changes ship the same day; before then it's aspirational. Treat as the destination, not the starting point.

## End-to-end

1. **Audit your current backlog.** Categorize items as: ship-now (one agent run), needs-spec (a few days), genuinely-deferred (waiting for an external event).
2. **Kill the ship-now category** — work them this week, all of them.
3. **For "focus dates" semantics**, change your task tracker convention: each task has a "start by" not a "done by." Surface the start date in dashboards; remove the due-date column.
4. **Hold an explicit "no-backlog day"** monthly: anything older than 30 days gets shipped, archived, or deleted.
5. **Coach engineers out of over-decomposition.** The new bottleneck is people who break tasks into 6 sub-tasks for the agent instead of letting the agent decompose.
6. **Expect attrition.** People who need deadlines and tickets will self-select out over a few quarters; that's the cost.

## Gotchas

- Without high graph density (codebase context, naming conventions, internal docs), one-prompt shipping fails and the team reverts to backlog frustration. Don't adopt this until #163 + #168 + a documented codebase are in place.
