---
id: B-133
tier: B
category: "Engineering productivity"
kind: pattern
title: "Plan mode plus hidden Claude Code model aliases for long sessions"
subtitle: "Problem solved: Long, multi-step engineering tasks lose context or under-plan unless the right model and plan mode are selected up front."
source: https://www.cybos.ai/cases/B-133
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · founder"
type: case
version: v0.1
---
# Plan mode plus hidden Claude Code model aliases for long sessions

> Problem solved: Long, multi-step engineering tasks lose context or under-plan unless the right model and plan mode are selected up front.

## What

Two non-obvious Claude Code model aliases plus plan mode collectively give a long-session discipline: `opusplan` uses Opus for planning and Sonnet for execution; `sonnet[1m]` opens a 1M-token context window; plan mode (now auto-triggering in CC 2.1+) fans out 10+ parallel sub-agents on complex codebase scans.

## Why it matters

Manual model switching wastes tokens and human attention. The aliases bake the planning-then-execution split into one command, and plan mode's parallel scan reportedly hits 100% on tasks (e.g. collecting 200+ API endpoints across a project) where a single-agent run from a different vendor failed.

## End-to-end

1. In Claude Code, run `/model opusplan` for any task that requires a plan before code edits — Opus drafts the plan, Sonnet executes each step.
2. For tasks that genuinely need the full context (large refactor reading many files), switch to `/model sonnet[1m]`.
3. Trust auto-plan-mode in CC 2.1+ — it self-toggles when complexity warrants; no need to type `/plan` or "ultrathink".
4. For multi-day work, keep one session and `resume` daily; auto-summarization preserves the thread.
5. Treat plan-mode's spawned sub-agents as part of your token budget — they accelerate scan but multiply usage.

## Prompts

```
`/model opusplan
/model sonnet[1m]
`
```

## Gotchas

- `sonnet[1m]` doubles pricing past 200K tokens — verify the task actually needs more than 200K context before defaulting to it.

<hr/>

## Tools

- Claude Code 2.1+ (terminal — aliases not exposed in the IDE plugin)
- Active Claude subscription or API key
