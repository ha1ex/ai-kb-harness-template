---
id: B-034
tier: B
category: "Operations"
kind: skill
title: "Retro Shaper — convert retrospective into prioritized Linear tasks"
subtitle: "Miro retros lose 40% of action items because nobody re-types them into Linear. One web UI does the impact/effort sort and the ticket creation."
source: https://www.cybos.ai/cases/B-034
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "PM · ops lead · founder running retros"
type: case
version: v0.1
---
# Retro Shaper — convert retrospective into prioritized Linear tasks

> Miro retros lose 40% of action items because nobody re-types them into Linear. One web UI does the impact/effort sort and the ticket creation.

## What

Takes raw retro outputs — exit interviews, comments, complaints, free-form retro notes — and renders them as an impact/effort matrix in a small web UI. Each card has a button that creates a Linear ticket auto-assigned to the most-likely owner.

## Why it matters

Replaces the "Miro board → someone re-types into Linear next week → 40% of items lost" loop. Goes from retro session to executable backlog in the same hour.

## End-to-end

1. Capture retro inputs as plain text (transcripts, form responses, pasted notes).
2. Skill `shaper` parses the text and clusters items by theme, tagging each with rough impact (S/M/L) and complexity (S/M/L).
3. Skill renders a static HTML page: graph view + sortable list. Team votes inline via thumbs.
4. Each item has a "Create in Linear" button calling the Linear API with: title, description, owner inferred from text, project, labels.
5. Run live at the end of the retro; click through prioritized items together.
6. Keep the rendered HTML as the retro artifact (replaces a Notion writeup).

## Gotchas

- Owner-inference is wrong ~30% of the time on first run. Always show the suggested owner; never assign silently.
- Resist letting the agent score "impact in revenue." It will fabricate numbers. Use S/M/L only unless you give it concrete revenue baselines.

## Tools

- Linear API token
- A vibe-coded HTML page or `/shaper` skill
- Retro data as text
