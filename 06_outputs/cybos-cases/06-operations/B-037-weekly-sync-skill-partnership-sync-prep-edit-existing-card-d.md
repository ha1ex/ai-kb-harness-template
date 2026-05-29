---
id: B-037
tier: B
category: "Operations"
kind: skill
title: "Weekly Sync skill — partnership sync prep (edit-existing-card discipline)"
subtitle: "Recurring partner syncs need prep nobody does. Agent edits the same card with last week's chat + commitments — history stays in one file."
source: https://www.cybos.ai/cases/B-037
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · BD lead · head of partnerships"
type: case
version: v0.1
---
# Weekly Sync skill — partnership sync prep (edit-existing-card discipline)

> Recurring partner syncs need prep nobody does. Agent edits the same card with last week's chat + commitments — history stays in one file.

## What

Pre-meeting agent run that refreshes the partnership-sync markdown card with the last week of partner-chat messages, related calls, and open commitments — by **editing the same card**, not generating a new one. Linear tickets get created where the agent finds a missed commitment.

## Why it matters

Zero-effort prep for recurring partner / investor / customer syncs. The "edit, don't spawn" discipline keeps history continuous: scrolling one file shows the full relationship arc instead of a folder of dated summaries.

## End-to-end

1. Create one Obsidian/markdown card per recurring sync (e.g. `partner-{name}-weekly-sync.md`).
2. Wire Telegram MCP, transcripts folder, Linear MCP into the agent.
3. Write a skill `weekly-sync` that takes the card path + the sync time, pulls last-week chat from the partner channel + team channel, plus all call transcripts tagged with the partner, and **updates the same card** with a new dated section.
4. Add explicit rule: "Do not create a new file. If a `weekly-sync` card already exists for this partner, edit it."
5. Have the skill create Linear tickets for any unmet commitments it surfaces.
6. Invoke an hour before the meeting via voice: "today's partnership sync at 12 — refresh the card."

## Prompts

```
`Today is partnership sync at 12:00 with {partner}. Pull the last week from the partner channel and team channel, plus all call transcripts tagged {partner}. Add a new dated section to {path/to/weekly-sync-partner.md} — do NOT create a new file. Create Linear tickets for any commitment we made but haven't acted on.
`
```

## Gotchas

- Agents default to creating new files. Without an explicit "edit existing" rule the folder explodes into one summary per week and history is lost.
- If commitments are extracted without source quotes, the Linear tickets read as hallucinations to teammates. Require a quote + speaker per ticket.

## Tools

- Claude Code or equivalent with Telegram MCP, Linear MCP
- One markdown card per recurring sync
- Transcripts folder fed by Granola / Krisp / similar
