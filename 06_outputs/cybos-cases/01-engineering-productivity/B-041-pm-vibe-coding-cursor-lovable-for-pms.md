---
id: B-041
tier: B
category: "Engineering productivity"
kind: tactic
title: "PM Vibe-Coding — Cursor / Lovable for PMs"
subtitle: "PMs write text specs engineers have to interpret. Train PMs to ship clickable prototypes; ambiguity dies before code starts."
source: https://www.cybos.ai/cases/B-041
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "product managers · design"
type: case
version: v0.1
---
# PM Vibe-Coding — Cursor / Lovable for PMs

> PMs write text specs engineers have to interpret. Train PMs to ship clickable prototypes; ambiguity dies before code starts.

## What

Trains product managers to build **interactive prototypes** with Cursor / Lovable / Claude Code instead of writing text specs or static Figma mocks. The PM is now a prototyper; the spec is a clickable artifact.

## Why it matters

Reported baseline: <20% of tasks at one fintech got a prototype before this; the rest were text specs that engineers had to interpret. After training, every meaningful task gets a clickable prototype. Engineering speeds up because ambiguity is resolved before they touch code. Long-term, this re-shapes the analyst role into "prototyper."

## End-to-end

1. Pick 3–5 PMs willing to learn. (Don't force the rollout — start with volunteers.)
2. Week 1: 2-hour workshop on Tailwind via CDN + shadcn/ui + Cursor. Each PM builds one one-page mockup.
3. Week 2: add D3/Mermaid for diagrams; each PM converts an existing text spec into a clickable prototype.
4. Week 3: PMs ship one prototype per real task; engineering reviews it as the spec.
5. Week 4: review what blocked them; promote 1–2 PMs into "vibe-coding champions" who help peers.
6. Measure: % of tasks with a clickable prototype, time-from-spec-to-merge.

## Gotchas

- Don't expect PMs to learn React semantics. Stay in Tailwind-CDN territory until they're comfortable; only later move to Vite + React + TS.
- Production temptation: a slick prototype gets shipped to customers without a real engineer pass. Mark prototypes with a visible "PROTOTYPE" banner and gate production deploys behind eng review.

## Tools

- Cursor / Lovable / Claude Code license per PM
- A simple shared deployment path (Vercel free tier — see #115 / #126)
- 4 weeks of attention from a champion
