---
id: B-038
tier: B
category: "Operations"
kind: workflow
title: "Quarterly OKR ritual + auto-status collection"
subtitle: "\"I'll update the status doc Friday\" rarely happens. Agent reads trackers + Git + chat; owners review instead of writing from scratch."
source: https://www.cybos.ai/cases/B-038
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "COO · head of strategy · founder"
type: case
version: v0.1
---
# Quarterly OKR ritual + auto-status collection

> "I'll update the status doc Friday" rarely happens. Agent reads trackers + Git + chat; owners review instead of writing from scratch.

## What

A quarterly OKR cadence where the **status column is collected automatically** instead of nagged out of people. An agent reads task trackers, Git activity, chat threads, and recent docs, and proposes a status update per OKR with evidence links. Owners review and edit rather than write from scratch.

## Why it matters

The execution gap between strategy and reality lives in the "I'll update the status doc on Friday" lie. Auto-collected status closes the gap from ~40–60% to ~80–90%. At a large wealth-management firm this pattern is approved as a board-level cadence, with quarterly priority streams per business line.

## End-to-end

1. Pick the cadence (quarterly works; monthly burns out reviewers).
2. Define each OKR as a markdown file with: objective, key results, owner, evidence sources (task tracker filter, repo path, chat tags).
3. Skill `okr-status` runs weekly: for each OKR, pull the linked evidence sources, summarize progress, propose a status (on-track / at-risk / off-track) with citations.
4. Owners review the proposed status, edit, commit. The full history of status updates lives in Git.
5. Quarterly review meeting reads the latest auto-collected status — discussion focuses on **what to change**, not "what's the actual number."
6. At quarter end the agent drafts the next quarter's OKR list from the previous quarter's misses + current strategy doc.

## Gotchas

- Status that's auto-collected but never read becomes wallpaper. Tie it to a real meeting with real decisions.
- Don't let the agent **set** status without owner sign-off — only **propose**. Otherwise everyone learns to ignore "on-track" since the agent never escalates.
- At early-stage scale (~30 ppl) OKRs may be premature; lighter weekly auto-collected priorities work better.

## Tools

- One source of truth per signal (task tracker filter, repo, chat tag)
- Agent with access to those sources
- One owner per OKR (no shared ownership)
