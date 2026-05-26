---
id: B-042
tier: B
category: "Engineering productivity"
kind: pattern
title: "Multi-Agent Dev Pipeline (4 agents)"
subtitle: "A single agent writes mediocre code, mediocre tests, no review. Four sequential agents (analyze → code → test → review) ship 5-10× faster."
source: https://www.cybos.ai/cases/B-042
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineer building the pipeline · downstream: any engineer on standard tasks"
type: case
version: v0.1
---
# Multi-Agent Dev Pipeline (4 agents)

> A single agent writes mediocre code, mediocre tests, no review. Four sequential agents (analyze → code → test → review) ship 5-10× faster.

## What

Four sequential agents on a typical feature task: **Analytics** (read spec, ask clarifying questions, produce a refined spec) → **Code** (implement) → **Tests** (generate + run) → **Review** (read diff vs. spec + style + architecture, comment). Each agent's output is the next agent's input; state persists in a JSON file or a GitHub Issue's comments (see #134).

## Why it matters

Reported 5–10× speedup on typical tasks. The "agentic IC" pattern — one engineer overseeing a four-agent pipeline — is the operational shape of an AI-native dev team. Quality stays high because the Review agent catches what the Code agent misses.

## End-to-end

1. Define each agent as a separate prompt with a single responsibility. Don't merge — narrow scope is what makes each agent good.
2. Pick a state substrate: JSON file in the repo, or a GitHub Issue with structured comments (recommended — see #127).
3. Wire each transition: Analytics writes its output, marks state `ready-for-code`. A trigger (cron, webhook, manual) runs the Code agent next. Same for Tests and Review.
4. Add a human gate after Analytics (spec review) and after Review (final approval).
5. Start with one task type (e.g. small UI fixes); add types only after the pipeline is stable on that one.
6. Weekly retro on failure modes; tune the agent prompts.

## Gotchas

- Don't run all four on critical-path code on day one. Trial on low-stakes work for 2–4 weeks.
- The Review agent must read the spec, not just the diff (cf. #104). Otherwise you've recreated the v1 noise problem.
- State sprawl: pick one substrate and stick to it.

## Tools

- A coding-agent runtime (Claude Code / Codex)
- State store (file, Issue, DB)
- A repo with #110 hierarchical `AGENTS.md` already in place
