---
id: B-033
tier: B
category: "Operations"
kind: workflow
title: "Meeting transcription + follow-up auto-tasks"
subtitle: "\"Who's taking the notes?\" tax on every meeting. Transcript → AI summary → tasks in the tracker with owners; commitments stop slipping."
source: https://www.cybos.ai/cases/B-033
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · ops lead · anyone running recurring leadership meetings"
type: case
version: v0.1
---
# Meeting transcription + follow-up auto-tasks

> "Who's taking the notes?" tax on every meeting. Transcript → AI summary → tasks in the tracker with owners; commitments stop slipping.

## What

Live call → transcript → AI summary with extracted commitments → tasks auto-created in the team's task tracker, with owner inferred from the speaker. The same transcript also updates per-project status cards (see #86).

## Why it matters

Eliminates the post-meeting "who's going to type up the notes" tax. Commitments stop slipping because they're in the tracker before the next sync. At the leadership tier, paired with daily AI use this is the enabler that lets 20+ leaders run on agents instead of meeting-action-item theatre.

## End-to-end

1. Turn on a transcription tool (Granola / Krisp / Fireflies / equivalent) on every recurring leadership meeting.
2. Drop transcripts into a watched folder with a naming convention (`YYYY-MM-DD-{meeting-type}.md`).
3. Skill `meeting-followup` runs on each new transcript: extract decisions, action items, owner, deadline. Cite the transcript timestamp per item.
4. Create tasks via the tracker API (Linear / Asana / Kaiten). Add the transcript link + timestamp as the task description.
5. Post a Slack/Telegram summary to the meeting channel with the task links.
6. Optional: weekly digest of "tasks created from meetings — done / open / overdue."

## Gotchas

- Don't auto-assign critical tasks; route as "suggested owner, please confirm" until the owner-inference accuracy is verified.
- Speaker labels matter — if transcripts merge two voices into one "Speaker 1," the wrong person gets the task. Use voice fingerprinting (Krisp DNA) or calendar attendee list as a hint.

## Tools

- Transcription tool with API or watched folder
- Task tracker API token
- A skill or scheduled agent runner
