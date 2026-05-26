---
id: B-020
tier: B
category: "HR & hiring"
kind: workflow
title: "Knowledge extraction from departing employee"
subtitle: "Senior departures cost six weeks of \"wait, how did they do X?\" Slack archaeology. Structured exit-interview turns tacit knowledge into versioned skills."
source: https://www.cybos.ai/cases/B-020
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "HR lead · manager · ops lead"
type: case
version: v0.1
---
# Knowledge extraction from departing employee

> Senior departures cost six weeks of "wait, how did they do X?" Slack archaeology. Structured exit-interview turns tacit knowledge into versioned skills.

## What

A skill triggered when an employee gives notice. Runs a structured interview protocol (50+ questions), cross-references their vault contributions and meeting transcripts, and outputs documented workflow runbooks and reusable agent skill files. The departing person's tacit knowledge becomes versioned artifacts before they walk out.

## Why it matters

At 30–100-person teams, every senior departure usually means 6+ weeks of "wait, how did they do X?" Slack archaeology. Extracting their workflows into named skills before exit converts a knowledge loss into a permanent capability. The US has institutionalized this practice for senior departures; AI now makes it tractable in 2–4 hours instead of two weeks of off-boarding interviews.

## End-to-end

1. Trigger when notice is given (day 0 of notice period).
2. Run the structured interview — 50+ questions covering: daily workflow, recurring rituals, tool stack with shortcuts, "who do you ask when X breaks", judgment calls you make weekly, the 3 things that would fall over if you left tomorrow.
3. Use voice + Wispr Flow for the interview — 2-hour session, transcribed live.
4. Agent reads the transcript + the person's vault contributions + their last 6 months of meeting transcripts.
5. Agent generates one **runbook** per recurring workflow + one **skill file** per agentic task.
6. Departing person reviews and corrects in their final week.
7. Successor (or interim owner) reads the runbooks day 1.

## Gotchas

- Don't try to do this in the last 3 days. Start day 0 of notice — by week 3 the person is mentally already gone and the quality drops.

<hr/>

## Tools

- Claude Code with access to the person's vault + transcripts
- Wispr Flow or similar dictation for the interview
- A "departing-employee skill" template
