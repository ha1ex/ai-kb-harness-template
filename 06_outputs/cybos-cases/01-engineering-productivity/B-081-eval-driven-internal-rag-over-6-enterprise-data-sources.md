---
id: B-081
tier: B
category: "Engineering productivity"
kind: workflow
title: "Eval-driven internal RAG over 6+ enterprise data sources"
subtitle: "Internal Q&A across billing, sheets, chat, Jira, GitHub, KB needs one pipeline per question class — not one universal RAG."
source: https://www.cybos.ai/cases/B-081
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "Engineering lead at a mid-size agency or services firm"
type: case
version: v0.1
---
# Eval-driven internal RAG over 6+ enterprise data sources

> Internal Q&A across billing, sheets, chat, Jira, GitHub, KB needs one pipeline per question class — not one universal RAG.

## What

Internal question-answering surface that reads from a long-tail enterprise stack: a billing / time-tracker SaaS, Google Sheets, Mattermost, client-Telegram, Jira / Confluence, GitHub, and the team's own KB. The shipped version uses one pipeline **per question class** — not a single universal RAG — and ships an evals harness against last year's real chat history.

## Why it matters

One agency lifted its internal AI-readiness score from 14 to 28 in three weeks using this exact case as the flagship project. The same team later sold the surface back to clients as part of its commercial offering. The anti-pattern caught along the way is broadly applicable.

## End-to-end

1. Question-class extraction: read last year of Mattermost / TG support chats. Cluster questions by type (project status, billing, on-call escalation, client info, code lookup). Output: 8–15 named question classes, each with 30–100 real examples.
2. For each class, decide which sources actually answer it. Resist "plug everything in"; most classes need 2 sources, not 7.
3. Build one pipeline per class: source-filter → retrieval → answer-template. Each pipeline is small and replaceable.
4. Eval harness: a held-out set of ~50 real questions per class, with human-verified gold answers. Score with judge-LLM + spot-check.
5. Ship the lowest-confidence class to internal users first. Capture failures into the eval set.
6. Iterate evals weekly. Promote a class to "production" only when judge-LLM score crosses a class-specific bar (varies — billing wants 0.95, exploratory wants 0.7).
7. Track AI-readiness score (see C-032) before/after.

## Prompts

Class-decomposition prompt:

```
`You are reading 12 months of internal support chats from a digital
agency. Cluster every question into 10-15 named classes. For each class, list:
- the canonical phrasing
- 5 real examples (verbatim)
- which data source(s) actually answer it
- estimated weekly volume

Output as JSON; one object per class. Do not invent classes for which there
are fewer than 3 real examples.
`
```

## Gotchas

- **"Plug everything in, hope for the miracle."** The team's recorded anti-pattern: connected every source, optimized evals to 80 %+, then asked real questions and got garbage. The evals had become lazy — they tested retrieval, not answer correctness. Fix: build evals from real chat history, not synthetic Q&A.

## Tools

- Claude Code (or equivalent) for pipeline construction
- Mattermost / TG / Jira / Sheets / GitHub API access
- Eval harness — DeepEval or a hand-rolled judge-LLM script
- 12 months of historical support chats for the class extraction pass
