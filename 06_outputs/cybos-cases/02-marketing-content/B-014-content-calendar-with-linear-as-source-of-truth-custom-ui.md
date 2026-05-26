---
id: B-014
tier: B
category: "Marketing & content"
kind: workflow
title: "Content calendar with Linear as source of truth + custom UI"
subtitle: "Linear's flat list is unusable for a content team that thinks in calendar grids. Vibe-code the calendar UI; keep Linear as the data."
source: https://www.cybos.ai/cases/B-014
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "Content lead · marketing team · founder-CMO"
type: case
version: v0.1
---
# Content calendar with Linear as source of truth + custom UI

> Linear's flat list is unusable for a content team that thinks in calendar grids. Vibe-code the calendar UI; keep Linear as the data.

## What

A custom calendar UI built on top of Linear as the source of truth (tasks, dates, platform tags, assignees) and Obsidian as the body store (post drafts, style notes). Live Instagram-analytics layer overlays per-post performance. Built in 3 days by a non-engineer team member at a startup using vibe-coding.

## Why it matters

Linear's flat list is hostile to a content team that thinks in calendar grids. A thin custom UI over the same data restores the workflow without locking the team into another SaaS. Per-post analytics show up where decisions are made, not in a separate tab.

## End-to-end

1. Make Linear the single source of truth: content tasks have `title`, `due date`, `platform tag`, `assignee`.
2. Each Linear task references a post body file in Obsidian (e.g., `Content/{date}-{slug}.md`).
3. Vibe-code a custom calendar UI that reads Linear via MCP / API and Obsidian content notes.
4. Pull Instagram (or other channel) analytics nightly into a small local store; overlay on past-date cells.
5. Wire a content-calendar skill that can update posts / dates by voice ("move next Tuesday's post to Friday").
6. Agent auto-generates draft cards from daily-sync output so the calendar fills itself.

## Gotchas

- The skill must hit Linear directly, not a Linear plugin inside Obsidian. The "trusted source" has to be the same record everywhere — duplicate state will diverge within a week.

<hr/>

## Tools

- Linear account + API / MCP
- Obsidian vault (or any markdown store)
- Channel analytics API (Instagram, X, etc.)
- A non-engineer who can vibe-code with Claude Code or similar
