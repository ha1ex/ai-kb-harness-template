---
id: C-143
tier: C
category: "Founder productivity"
kind: pattern
title: "Phased conversational audit of a long-running context corpus"
subtitle: "Problem solved: Founder context files (mission / goals / principles) decay silently; a phased completeness-driven audit refreshes the corpus without firehose-prompting."
source: https://www.cybos.ai/cases/C-143
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "L · Quarter"
type: case
version: v0.1
---
# Phased conversational audit of a long-running context corpus

> Problem solved: Founder context files (mission / goals / principles) decay silently; a phased completeness-driven audit refreshes the corpus without firehose-prompting.

## What

A portable pattern: a scanner first measures completeness/staleness across a long-lived context corpus, then switches into an interview mode that asks one question at a time in priority order (most-decayed section first) instead of dumping a 30-question form. The abstraction — scanner → mode-switch → phased one-question-at-a-time priority — generalizes beyond any specific context schema.
