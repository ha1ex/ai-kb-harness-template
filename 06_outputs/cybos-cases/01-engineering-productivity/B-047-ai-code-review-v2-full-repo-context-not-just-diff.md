---
id: B-047
tier: B
category: "Engineering productivity"
kind: workflow
title: "AI Code Review v2 — full repo context, not just diff"
subtitle: "Diff-only review bots produce 90% irrelevant comments. Full repo context (architecture + history + checklist) becomes the second reviewer."
source: https://www.cybos.ai/cases/B-047
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineering lead · senior engineers"
type: case
version: v0.1
---
# AI Code Review v2 — full repo context, not just diff

> Diff-only review bots produce 90% irrelevant comments. Full repo context (architecture + history + checklist) becomes the second reviewer.

## What

A code-review agent that reads the **full repo context** (architecture docs, related modules, historical MR comments, the team's review checklist) before commenting on a PR. Replaces "v1" diff-only bots whose comments are ~90% irrelevant.

## Why it matters

At a ~large fintech, the v1 attempt failed because the agent only saw the diff and produced noise. The v2 version takes over as one of two required reviewers, freeing 30–100 senior-engineer hours per day across the org — order of ~$120–400K/year.

## End-to-end

1. Commit a `CLAUDE.md` / `AGENTS.md` at the repo root pointing at: architecture docs, style guide, recent ADRs, list of historical MR-comment patterns.
2. Wire the review agent into the PR pipeline (GitHub Action / GitLab CI / Bitbucket pipeline).
3. On PR open/update: the agent reads the diff + the rule files + related modules referenced in the diff + the last N comments on similar files.
4. It posts review comments scoped by category: correctness, architecture-fit, missing tests, security, style. Each comment cites the rule it derives from.
5. Tune the rule file every week from comments engineers flagged as noise.
6. Once the noise rate is <20%, count the agent as one of two required reviewers.

## Gotchas

- Skipping the rule file. Without it the v2 agent regresses to v1 noise within a sprint.
- Letting the agent block merges. It should comment and suggest; humans approve.

## Tools

- Claude Code / Codex / equivalent with repo-read access
- Hierarchical `AGENTS.md` (see #110)
- CI integration
