---
id: B-063
tier: B
category: "Founder productivity"
kind: workflow
title: "Morning brief"
subtitle: "\"What should I work on today?\" anxiety. Five overnight workflows produce one consolidated brief with risks, prep, and follow-ups."
source: https://www.cybos.ai/cases/B-063
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · executive · sales leader"
type: case
version: v0.1
---
# Morning brief

> "What should I work on today?" anxiety. Five overnight workflows produce one consolidated brief with risks, prep, and follow-ups.

## What

A nightly cron job that syncs the CRM to a local Postgres, then runs five separate workflows that produce one consolidated morning brief: (1) early risk detection (deals that went silent), (2) auto-overload detection (your calendar versus your stated focus areas), (3) AI funnel analysis (pipeline movement vs last week), (4) meeting prep without routine (briefs for today's calls), (5) auto follow-up commitment tracking (things you promised on calls last week that haven't shipped). Output: one markdown file or HTML dashboard you open with coffee.

## Why it matters

A large fintech CCO built a working version of this in Cursor at $20/mo and runs it daily; multiple other founders run variants. The pattern works because each of the five workflows is small and standalone — failure of one doesn't break the brief. The founder gets all five outputs without ad-hoc requests, and the brief replaces "what should I work on today" anxiety with a concrete priority list.

## End-to-end

1. **Nightly cron**: sync source-of-truth CRM to a local Postgres (or SQLite).
2. **Connect Gmail / Telegram via MCP** for the follow-up-tracking workflow.
3. **Connect a transcription source** (existing pipeline — Whisper, Granola, or vendor) for meeting-prep input.
4. **Write five small prompts**, one per deliverable. Each ≤30 lines; each writes a section of the brief.
5. **Aggregate into one markdown file** under today's date; render to HTML if you want a dashboard.
6. **Trigger from launchctl / cron at 06:00**; surface the file path in a Raycast snippet.
7. **Tune over 2 weeks** — drop deliverables that you never read; add ones that surface real surprises.

## Gotchas

- Format the brief for the format you'll actually read at 7am — short markdown beats fancy HTML. Re-tune monthly; staleness is the failure mode.

## Tools

- Local Postgres / SQLite
- CRM API access
- Gmail MCP, Telegram export, transcription pipeline
- Claude Code or Cursor for orchestration
