---
id: B-064
tier: B
category: "Founder productivity"
kind: tactic
title: "Personal traits / psyche file"
subtitle: "Agents give generic best-practice advice because they don't know how you operate. Feed your psyche file; partnership and hiring decisions improve."
source: https://www.cybos.ai/cases/B-064
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · executive · anyone preparing for high-stakes negotiations"
type: case
version: v0.1
---
# Personal traits / psyche file

> Agents give generic best-practice advice because they don't know how you operate. Feed your psyche file; partnership and hiring decisions improve.

## What

A private folder containing your CV, personality-test results (Hogan / Big Five / Enneagram), year-end retrospective, therapy / coaching notes, education history. When entering a partnership negotiation, fundraising call, or new hire onboarding, the agent reads this file and suggests collaboration strategies tuned to how you actually operate — "you decay focus in long meetings; suggest ending at 45 min" or "you tend to over-commit on day-of; sleep on this offer."

## Why it matters

Founders who use this report "much higher quality" partnership outcomes. The pattern is small but compounds: agents that know your operating constraints make better recommendations than generic "best practice" outputs. The file is also the durable artifact when entering new contexts — therapy notes get out of your head and into a place the next decision can reference.

## End-to-end

1. **Create `personal/me/` in your vault** with a high-security flag (excluded from team sync, encrypted at rest if possible).
2. **Drop in source material**: CV, any psychometric reports, your last year-end retrospective. If you don't have one, run the year-review playbook (#220 Tier A).
3. **Have the agent summarize the corpus** into a one-page operating profile — energies, drains, decision biases, communication style.
4. **Reference the profile from your `CLAUDE.md`** as context for partnership / negotiation / hiring prompts.
5. **Update annually** as part of your year-end review.

## Gotchas

- Privacy posture matters: this folder must never sync to team-shared infra. Set the sync exclusion before adding the first file.

## Tools

- A secure folder in your vault
- Optional psychometric tests
- Existing year-end retrospective or the discipline to write one
