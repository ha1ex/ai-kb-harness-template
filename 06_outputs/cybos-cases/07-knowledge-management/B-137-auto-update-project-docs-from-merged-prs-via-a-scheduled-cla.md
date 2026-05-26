---
id: B-137
tier: B
category: "Knowledge management"
kind: workflow
title: "Auto-update project docs from merged PRs via a scheduled Claude job"
subtitle: "Problem solved: Docs drift from code because \"we never have time to update them\"; a daily scheduled Claude job rereads each merged PR and rewrites affected docs without human intervention."
source: https://www.cybos.ai/cases/B-137
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · tech lead"
type: case
version: v0.1
---
# Auto-update project docs from merged PRs via a scheduled Claude job

> Problem solved: Docs drift from code because "we never have time to update them"; a daily scheduled Claude job rereads each merged PR and rewrites affected docs without human intervention.

## What

Configure a Claude Code scheduled cloud task that, once a day, clones the repo, lists PRs merged since the last run, reads the diffs, identifies affected `.md` files, edits them in place, and commits and pushes the doc updates back to the repo. Documentation becomes a continuously regenerated artifact rather than a thing humans curate.

## Why it matters

Removes a recurring failure mode for any growing codebase. Once running, every merge is automatically reflected in the docs — onboarding pages, architecture notes, API references — without depending on engineer discipline.

## End-to-end

1. Pick a docs structure: keep source-of-truth docs in `/docs/*.md` inside the same repo as the code.
2. Give Claude write access (commit/push) via a deploy key or a bot account scoped to that repo.
3. Set up a scheduled Claude task that runs daily. Have the agent list PRs merged in the last 24h via `git log --since` or the platform API.
4. For each PR, have the agent read the diff and propose doc edits limited to the touched modules or surfaces. Edit, commit on a branch named e.g. `docs/auto-YYYY-MM-DD`, open a PR.
5. Optionally auto-merge if a syntax-only or test passes; otherwise leave the PR for human review.
6. Watch the first week's output and tighten the prompt: which doc sections it's allowed to edit, what tone to keep, what NOT to invent.

## Gotchas

- Hosting the job on the vendor cloud means your repo credentials live there. If that's a concern, point the schedule at a self-hosted runner (Mac mini or VPS) holding the credentials locally.

<hr/>

## Tools

- Claude Code with scheduled task support (cloud-hosted)
- Git repo with write access for the agent
- Source-of-truth docs committed as Markdown
