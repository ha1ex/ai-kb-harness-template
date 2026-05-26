---
id: B-045
tier: B
category: "Engineering productivity"
kind: tactic
title: "Walk-up AI workstations — 24/7 lab"
subtitle: "People with \"almost installed\" tools never experiment. Pre-loaded office terminals make adoption a 30-second walk-up decision."
source: https://www.cybos.ai/cases/B-045
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "ops · IT · head of AI"
type: case
version: v0.1
---
# Walk-up AI workstations — 24/7 lab

> People with "almost installed" tools never experiment. Pre-loaded office terminals make adoption a 30-second walk-up decision.

## What

Dedicated office terminals (3–5 to start) preloaded with the standard agent stack — Claude Code, Codex, Cursor, the company's shared `AGENTS.md`, common MCPs, and a curated bookmark of skills. Open 24/7 to any employee. Goal: collapse the distance from "I have an AI idea" to "I'm trying it in 30 seconds."

## Why it matters

The biggest adoption gap is friction. People who don't have the tools installed don't experiment, and people who almost-have-them-installed never finish. A walk-up lab makes adoption a 30-second decision. Used as a lever to push adoption from ~10% to 50%+ in target functions.

## End-to-end

1. Buy 3–5 powerful workstations + good monitors + comfortable chairs. Place near coffee / lunch area.
2. Pre-install: Claude Code, Codex CLI, Cursor, the company's MCP stack, the shared `AGENTS.md` cloned, the skills repo cloned, a dictation tool, Raycast (if Mac).
3. Use a shared service account with quota limits; auto-reset session state between users (or auto-create per-user scratch dirs).
4. Print a one-page "what you can do here in 5 minutes" handout with three example prompts.
5. Run weekly "drop-in hours" — one champion sits at the lab for an hour, anyone can come ask.
6. Measure: number of distinct users per week; number of skills first-tried at the lab.

## Gotchas

- If you let stations rot (outdated tools, broken MCP keys) they become anti-marketing. Assign one owner.
- Don't gate by reservation. Walk-up is the point.

## Tools

- Hardware budget (~$3–5K per station)
- A shared license/quota account
- One owner who keeps the stations updated
