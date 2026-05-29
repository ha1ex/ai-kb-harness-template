---
id: C-048
tier: C
category: "Infrastructure"
kind: pattern
title: "Auto-Eval T/R/C binary-pass discipline"
subtitle: "\"Score 1-5\" evals drift toward \"3 — meh\". Pass/fail/n-a only; three fails trigger a new rule; \"is this passing?\" gets one answer."
source: https://www.cybos.ai/cases/C-048
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "skill author · governance lead"
type: case
version: v0.1
---
# Auto-Eval T/R/C binary-pass discipline

> "Score 1-5" evals drift toward "3 — meh". Pass/fail/n-a only; three fails trigger a new rule; "is this passing?" gets one answer.

## What

Skill evals only produce binary pass / fail / n-a — never 1–5 scales. Three fails in one zone trigger a new rule proposal. Forces the eval to be specific enough that "is this passing?" has one answer.
