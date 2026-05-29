---
id: C-124
tier: C
category: "Infrastructure"
kind: pattern
title: "Physical phone in the loop — ADB + screenshots + xdotool for app automation"
subtitle: "Problem solved: some workflows live entirely inside mobile apps (food delivery, mobile QA of your own product) where no web API exists."
source: https://www.cybos.ai/cases/C-124
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
type: case
version: v0.1
---
# Physical phone in the loop — ADB + screenshots + xdotool for app automation

> Problem solved: some workflows live entirely inside mobile apps (food delivery, mobile QA of your own product) where no web API exists.

## What

Connect a physical Android phone via ADB from a Mac mini or VPS; the agent loop is: take screenshot → vision model identifies UI element coordinates → ADB sends tap/text → repeat. Reference grounding-model benchmark cited in source: gui-agent.github.io/grounding-leaderboard — Holo2-8B for commercial, Holo2-235B-A22B for research. Known failure modes: LLM-predicted coordinates often off; mobile keyboards hide form fields.
