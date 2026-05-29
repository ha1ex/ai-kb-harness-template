---
id: B-148
tier: B
category: "Strategy & leadership"
kind: framework
title: "AI-driven product-idea funnel — 1000 → 50 → 10 → 1 via a 3-category rubric"
subtitle: "Problem solved: Founders running idea-factories or evaluating dozens of product candidates manually burn weeks on the sort; an AI scoring framework over a 3-category rubric collapses the funnel into hours and surfaces a credible top-10."
source: https://www.cybos.ai/cases/B-148
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · product lead"
type: case
version: v0.1
---
# AI-driven product-idea funnel — 1000 → 50 → 10 → 1 via a 3-category rubric

> Problem solved: Founders running idea-factories or evaluating dozens of product candidates manually burn weeks on the sort; an AI scoring framework over a 3-category rubric collapses the funnel into hours and surfaces a credible top-10.

## What

Codify the validation rubric you already use by hand for business research into an AI scoring system. Ingest a list of raw idea descriptions, score each against three idea-categories, validate the system against your past decisions to calibrate, then rank composite scores. Final pick is a human filter — "what's closest to my domain familiarity" — over the top-10.

## Why it matters

One operator running an idea-factory reports compressing ~1000 raw ideas to ~50 worth attention and ~10 worth building, with the top-1 becoming the next product to ship. The leverage is not the scoring itself — it's that the funnel runs in a day, so you can re-run it whenever the market shifts.

## End-to-end

1. **Articulate the rubric you already use.** Write down what you actually weigh when evaluating ideas manually — market size, ICP clarity, AI-native fit, distribution lever, founder-domain match. Three composite categories tends to be the right ceiling.
2. **Translate the rubric into a structured skill.** One skill file per category with the questions an agent must answer; one orchestrator skill that aggregates scores.
3. **Calibrate against past decisions.** Feed in 10–20 ideas you have already accepted or rejected. The system should reproduce roughly your historical picks. If it can't, the rubric is fuzzy — tighten it before trusting forward decisions.
4. **Ingest the raw idea list.** Source from your own backlog, trend scrapes, app-store deltas, or a deep-research run. Aim for ≥500 candidates so the funnel has signal.
5. **Run the scoring.** Each idea gets a score per category and a composite. Rank, cut to top-50, then top-10.
6. **Human pick at the top.** Of the top-10, the founder selects by domain familiarity — not by raw score. The framework finds and ranks; the human picks.

## Gotchas

- Trusting the ranking before calibration. Skipping the "validate against past decisions" step is the failure mode — without it, the rubric drifts and the top-10 becomes garbage-in-garbage-out. One operator notes the system itself is "complex" and worth a dedicated writeup; treat v1 as calibration-only.

<hr/>

## Tools

- An agent with research tools (web search, market-data lookups)
- A structured rubric committed as a skill or prompt template
- A backlog of past idea decisions for calibration
