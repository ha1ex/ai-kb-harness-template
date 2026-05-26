---
id: B-048
tier: B
category: "Engineering productivity"
kind: pattern
title: "Hard pipelines on agents — durable JSON state"
subtitle: "\"Agent forgot mid-pipeline\" bugs are universal. Externalise state to JSON; agents are workers; swap models per step; retry only the failed one."
source: https://www.cybos.ai/cases/B-048
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineer building automation · founders running content / lead / data pipelines"
type: case
version: v0.1
---
# Hard pipelines on agents — durable JSON state

> "Agent forgot mid-pipeline" bugs are universal. Externalise state to JSON; agents are workers; swap models per step; retry only the failed one.

## What

For multi-step pipelines that must be deterministic despite using stochastic agents, persist explicit state in a JSON file (or a GitHub Issue's comments — see #127). Every step reads the JSON, does its work, writes its outputs back, advances the state. The skeleton is the JSON; the agents are workers.

## Why it matters

Most "the agent forgot mid-pipeline" bugs disappear once state is external and addressable. The pattern lets you swap models per step (cheap model for filtering, expensive for synthesis), retry just the failed step, and audit any pipeline by reading the JSON. A real example: a blog pipeline producing ~3,000 visitors/month, running for months without re-deploys.

## End-to-end

1. Decompose the pipeline into named stages with clear contracts: input fields, output fields, retry policy.
2. Define a JSON schema for the run state. Minimal:

```
`{
"run_id": "...",
"stage": "research",
"current_step": 3,
"artifacts": {"research_notes": "..."},
"history": [{"stage": "...", "ts": "...", "status": "..."}]
}
`
```

1. Each agent step reads the JSON, performs its work, updates the JSON, commits or pushes a record.
2. Decide the substrate: a file in the repo (simplest), a GitHub Issue's comments (durable + queryable), or a real DB (Postgres on Railway / Supabase).
3. Add a top-level controller (cron / webhook / human trigger) that advances stages.
4. Each stage logs to a `runs/` folder for replay & debugging.

## Gotchas

- Don't bury state in a vector DB. State should be human-readable and human-editable.
- Don't conflate "state JSON" with "all data the pipeline produces." State holds pointers; bulky artifacts live in files.
- Two writers to the same JSON without locking will corrupt it. Either single-writer or use a real DB.

## Tools

- A persistence layer (file/Issue/DB)
- A controller / scheduler
- Coding agent for each stage
