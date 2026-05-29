---
id: B-138
tier: B
category: "Knowledge management"
kind: workflow
title: "Auto-load meeting transcripts into Claude Code on session start (SessionStart hook)"
subtitle: "Problem solved: Founders re-paste meeting context every Claude session; a SessionStart hook extracts the day's transcripts and injects them at boot so the agent already knows what the calls were about."
source: https://www.cybos.ai/cases/B-138
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founders and operators with ≥3 calls/day"
type: case
version: v0.1
---
# Auto-load meeting transcripts into Claude Code on session start (SessionStart hook)

> Problem solved: Founders re-paste meeting context every Claude session; a SessionStart hook extracts the day's transcripts and injects them at boot so the agent already knows what the calls were about.

## What

A Claude Code `SessionStart` hook fires when you launch CC. The hook script reads Granola's local transcript store, pulls the day's calls, and injects them into the session along with a classification prompt that tags each transcript by deal / company / topic. Result: every CC session opens already aware of recent meetings — no copy-paste, no "let me catch you up." Mac-only as currently shipped.

## Why it matters

Founders running 4+ calls per day repeatedly hit the same friction: every CC session starts cold, every follow-up requires re-pasting context, every CRM update needs the operator to summarize. The hook removes that step entirely; the agent already has the morning's meetings classified before you type the first prompt.

## End-to-end

1. Write `extract-granola.ts` — script that reads Granola's local transcript files from disk and emits the day's transcripts as text (Granola stores them in user library on Mac).
2. Write `load-context.ts` — the SessionStart hook entry point that calls `extract-granola.ts`, wraps the output with a classification prompt (assign each transcript to deals/companies/topics), and prints to stdout for CC to ingest.
3. Register the hook in `~/.claude/settings.json` under the `SessionStart` event, pointing at `load-context.ts`.
4. Adapt the classification prompt to your taxonomy (your deal pipeline, your team, your projects). The default is opinionated and won't match yours.
5. Test: open a new CC session and verify the boot output shows the day's calls grouped by category.

## Gotchas

## The classification prompt is opinionated to one operator's deal/company taxonomy and will produce noise out of the box for anyone else. Strip the classification section first, confirm the raw transcript injection works, then layer your own taxonomy back on top. Also: if you have 10+ calls/day the injected context can blow past the session-start budget — cap by recency or by attendee.

## Tools

- macOS (Granola is Mac-first; the hook depends on local file paths)
- Granola installed and capturing transcripts
- Claude Code with `SessionStart` hooks supported
- TypeScript (or Node) to run the two scripts
