---
id: B-119
tier: B
category: "Engineering productivity"
kind: workflow
title: "Async dev via Slack-mentioned agent (Codex/Claude in a dedicated channel)"
subtitle: "Problem solved: Feedback piles up faster during client calls and stand-ups than anyone can implement; mentioning an agent in Slack converts that backlog into ready-to-merge PRs by the end of the meeting."
source: https://www.cybos.ai/cases/B-119
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · engineer · eng lead"
type: case
version: v0.1
---
# Async dev via Slack-mentioned agent (Codex/Claude in a dedicated channel)

> Problem solved: Feedback piles up faster during client calls and stand-ups than anyone can implement; mentioning an agent in Slack converts that backlog into ready-to-merge PRs by the end of the meeting.

## What

Install the Codex Slack app or Claude Code's Slack integration. Whenever feedback or a small task surfaces in a meeting, drop it into a dedicated channel and @-mention the agent. It picks up the message, spins up a branch per task in the background, and files a PR. Slack becomes the queue; the laptop stays closed.

## Why it matters

Reported one-shot rate around 60% on small tasks. The asynchronous queue means a 60-minute call can produce 10 PRs in parallel without anyone touching a terminal. Larger tasks land as draft branches a human can finish.

## End-to-end

1. Create one dedicated Slack channel per project for agent dispatch (`#agent-projectX`).
2. Install the Codex Slack app or Claude Code's Slack integration; authorize against the repo.
3. During calls, type or paste each feedback item as a fresh message and @-mention the agent. Keep one task per message.
4. Let the agent fan out: one branch + one PR per mention. Don't expect a back-and-forth — these dispatchers are one-shot.
5. After the call, triage PRs: merge the clean ones, leave comments on the half-baked ones, claim the rest for a human pass.
6. Use Codex for async/long tasks; Codex's strength is that it works in the background. Use Claude Slack when the task needs more reasoning per shot.

## Gotchas

- Codex Slack is one-shot only. Don't expect a conversational loop in the channel — write each task as a complete, standalone instruction or you'll get a PR that solves the wrong problem.

<hr/>

## Tools

- Slack workspace, repo with PR-based workflow
- Codex CLI or Claude Code with the official Slack app installed
- One Slack channel per project + clear naming convention so @-mentions don't cross-fire
