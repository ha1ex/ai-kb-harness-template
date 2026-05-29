---
id: B-118
tier: B
category: "Engineering productivity"
kind: skill
title: "superflow — Claude + Codex parallel orchestration with markdown state"
subtitle: "Problem solved: Heavier orchestrators (DB, trackers) are overkill for a solo founder running multi-hour parallel agent runs."
source: https://www.cybos.ai/cases/B-118
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · vibecoder"
type: case
version: v0.1
---
# superflow — Claude + Codex parallel orchestration with markdown state

> Problem solved: Heavier orchestrators (DB, trackers) are overkill for a solo founder running multi-hour parallel agent runs.

## What

`superflow` is a public skill (fork of obra/superpowers) that orchestrates multi-hour Claude Code sessions using pure markdown for state — no database, no tracker. It pairs subagents: Claude for spec/brainstorm, Codex for review/audit. A typical run frontloads ~1.5h of human brainstorm and approvals, then runs autonomously for 6+ hours producing merged PRs.

## Why it matters

The reported "go to sleep, wake up to merged PRs" workflow: a roadmap dictated by voice from Telegram, superflow runs through the night, you review what landed in the morning. One operator reports running 3-7 night agents in parallel this way. The markdown-as-state approach is concrete enough to drive predictable output without imposing the bureaucracy of a database-backed orchestrator.

## End-to-end

1. Clone [https://github.com/egerev/superflow](https://github.com/egerev/superflow) into your `~/.claude/skills/` directory.
2. Let it run its first-run project audit — it scans the codebase and writes a quality baseline before letting you start work.
3. Write your roadmap as a markdown file in the format the skill expects.
4. Start a CC session, invoke the skill, walk through its upfront brainstorm/architecture questions.
5. Once it switches to autonomous mode, leave it. Subagents (Claude for spec passes, Codex for review/audit) run in parallel and update markdown state files as they go.
6. Wake up, review the PRs it merged.

## Gotchas

- Even with strong test coverage, you still need manual product-correctness verification at the end. The author flags this honestly: superflow produces "much good test-covered code that doesn't actually work product-wise on small details." Reserve 15-30 minutes for a human walkthrough of the shipped feature before declaring done.

<hr/>

## Tools

- Claude Code
- Codex CLI (for the review/audit subagent)
- A repo with reasonable test coverage (the autonomous mode trusts tests as the completion signal)
