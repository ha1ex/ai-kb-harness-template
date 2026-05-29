---
id: B-036
tier: B
category: "Operations"
kind: skill
title: "Weekly retro skill — surface candidates for packaging into skills"
subtitle: "Same prompt typed 4 times this week. Agent flags repeated sequences as skill candidates so personal automation compounds."
source: https://www.cybos.ai/cases/B-036
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "any operator running their own agents (founder · engineer · ops)"
type: case
version: v0.1
---
# Weekly retro skill — surface candidates for packaging into skills

> Same prompt typed 4 times this week. Agent flags repeated sequences as skill candidates so personal automation compounds.

## What

Once a week, an agent reviews all GitHub Issues closed in the current ISO week (its memory store — see #127) and flags **repeated sequences** as candidates to be packaged into reusable skills. You get a ranked list: "you did X manually 4 times this week — promote to skill?"

## Why it matters

Compounds personal automation. Every week the operator's AI ops get slightly more efficient instead of stagnating at "I keep typing the same prompt."

## End-to-end

1. Prerequisite: every task creates a GitHub Issue (see #127 Project-as-Memory).
2. Tag each Issue with the ISO week (e.g. `week-19-2026`).
3. Sunday cron or manual trigger runs the `weekly-retro` skill: "review all `week-19-2026` issues. Cluster by action pattern. For each cluster ≥3 items, propose a skill name + one-paragraph description."
4. Skim the output. Promote 1–2 top candidates into actual skill files in `skills/`.
5. The next week's retro should show those former candidates as "now automated."

## Gotchas

- Don't promote everything. Three repetitions is the floor; below that you're encoding noise.
- The skill suggestions read smarter than they are — review with skepticism. A skill that needs five prompt-tweaks per run is worse than no skill.

## Tools

- GitHub Issues used as task memory (see #127)
- Claude Code / Codex with skills support
