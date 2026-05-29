---
id: C-089
tier: C
category: "Engineering productivity"
kind: tactic
title: "55-bullshit-question benchmark as truthfulness regression test"
subtitle: "Problem solved: Every model upgrade can quietly degrade truthfulness — models confidently fabricate answers to nonsense questions; running the same nonsense-question set across versions catches the regression."
source: https://www.cybos.ai/cases/C-089
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "ML / eval-conscious engineering team"
type: case
version: v0.1
---
# 55-bullshit-question benchmark as truthfulness regression test

> Problem solved: Every model upgrade can quietly degrade truthfulness — models confidently fabricate answers to nonsense questions; running the same nonsense-question set across versions catches the regression.

## What

Maintain a static list of ~55 deliberately-nonsensical questions (the publicly-circulated "55 bullshit questions" set is a common starting point). Run it against each new model release; any answer that isn't "this question doesn't make sense" is a confabulation. Operator observation: all models except the most recent Opus/Claude generation started bullshitting confidently.
