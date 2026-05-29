---
id: B-136
tier: B
category: "Knowledge management"
kind: skill
title: "Multi-tier deep-research skill with intensity levels and a quality gate"
subtitle: "Problem solved: Some research questions deserve a one-shot agent; others need fan-out plus a quality verdict — operators waste tokens by always running the heavy version."
source: https://www.cybos.ai/cases/B-136
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · investor · researcher"
type: case
version: v0.1
---
# Multi-tier deep-research skill with intensity levels and a quality gate

> Problem solved: Some research questions deserve a one-shot agent; others need fan-out plus a quality verdict — operators waste tokens by always running the heavy version.

## What

A Claude Code skill that exposes three intensity tiers — Light, Medium, Heavy — and a 5-phase pipeline (planning → parallel research → synthesis → quality gate → report). Light is one agent, one pass. Heavy spawns parallel aspect-researchers (each doing dual-source search), synthesizes across them, and runs a quality-gate that scores saturation/diversity/tier-quality with a PASS | WARN | FAIL verdict before letting the report-generator finalize.

## Why it matters

Without explicit intensity choice, deep-research skills either over-spend on trivial queries or under-deliver on heavy ones. The PASS/WARN/FAIL gate replaces a human "is this enough?" judgment call with a measurable verdict, which makes the skill safe to run unattended (e.g., in a nightly research cron). Used in practice for investment DD, content research, and founder strategy work; pairs with (the broader multi-provider deep-research aggregator) as the intensity-tier wrapper around it.

## End-to-end

1. Install the skill into `~/.claude/skills/Research/` — the public reference structure is in the cybos repo at github.com/Gerstep/cybos.
2. On invocation, pick a tier (Light for a single quick question, Medium for a structured topic, Heavy for DD-quality multi-aspect work).
3. The `research-planner` agent decomposes the topic into 3-7 aspects and writes `plan.yaml`.
4. For Medium/Heavy: parallel `aspect-researcher-v2` agents run dual-source search (e.g. Exa + Brave) and write `aspects/{id}.yaml`.
5. `synthesis` aggregates results into `synthesis.yaml` with cross-aspect insights and evidence links.
6. `quality-gate` scores saturation/diversity/tier-quality and emits PASS | WARN | FAIL.
7. On PASS, `report-generator` writes `FINAL_REPORT.md`. On WARN/FAIL, route back for a gap-fill round.

## Gotchas

- The original skill is missing a dedicated "phase 2b net-new gap fill" round and a separate auditor agent — author flagged both as gaps. Without them, WARN verdicts often just produce a longer report rather than actually filling the missing aspects. Add an explicit auditor pass if you rely on this unattended.

<hr/>

## Tools

- Claude Code
- A search-API combination (Exa + Brave is the documented pairing)
- Optional: Gemini Search Grounding via Vertex (see for the cost trick)
