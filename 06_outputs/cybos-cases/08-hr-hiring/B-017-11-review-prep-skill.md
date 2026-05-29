---
id: B-017
tier: B
category: "HR & hiring"
kind: skill
title: "1:1 & review prep skill"
subtitle: "1:1s start with \"what should we talk about?\" Pre-filled agenda from role card + tasks + history; raise-evaluation overlay for the hard calls."
source: https://www.cybos.ai/cases/B-017
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · hiring manager · manager"
type: case
version: v0.1
---
# 1:1 & review prep skill

> 1:1s start with "what should we talk about?" Pre-filled agenda from role card + tasks + history; raise-evaluation overlay for the hard calls.

## What

One CLI command reads a person's role card (with `## 1-1 History`), their personal HR folder, and recent tasks from the task tracker — then generates a pre-filled review agenda. Supports four review types: Monthly 1-on-1, Quarterly Review (with compensation), Annual Review (with 360 feedback), Fit Assessment (end of Month 1 for new hires). For unusually large raises the founder can layer on a second pass: same data, two prompts — "why this person deserves the biggest raise" vs "why no raise, possibly part ways" — both with citations.

## Why it matters

Removes the "what should we talk about?" friction at every 1-on-1 and calibrates compensation discussions against actual quarterly data. The raise-evaluation overlay catches false positives at 30+ headcount where the founder doesn't directly work with the person daily.

## End-to-end

1. Maintain role card with disciplined `## 1-1 History` entries — date, wins, blockers, next-month focus.
2. Run `/team-hr review Anna`.
3. Skill reads role card, personal HR folder, task tracker (Linear MCP).
4. Skill outputs agenda: Wins (5m) / Blockers (10m) / KPI progress (10m) / Next month scope (10m) / Open questions (5m), pre-populated with data points.
5. For Quarterly: add KPI scorecard, compensation review, growth path (title, equity, new directions).
6. For raise calibration: run two opposing prompts, both demanding citations from the person's outputs (Slack/calls/tasks/commits).
7. After the meeting, log a dated entry to `## 1-1 History`.

## Gotchas

- Compensation discussion artifacts must live in the personal HR folder `Org/HR/{Person}/`, **never** in the role card body — the role card is read by anyone running `/team-hr roster` and comp leaks have a cultural blast radius. Treat the raise-evaluation output as input, not authority: spot-check cited evidence (LLMs will hallucinate "commits" that don't exist).

<hr/>

## Tools

- Claude Code + `team-hr` skill
- Linear (or other task tracker) MCP
- Disciplined role-card maintenance
