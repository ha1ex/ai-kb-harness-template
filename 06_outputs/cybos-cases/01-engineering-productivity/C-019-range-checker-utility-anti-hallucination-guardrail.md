---
id: C-019
tier: C
category: "Engineering productivity"
kind: pattern
title: "Range-checker utility (anti-hallucination guardrail)"
subtitle: "LLMs confidently flunk \"is 47 between 40 and 50?\" 20 lines of Python + one rule in.cursorrules eliminates a whole class of bugs."
source: https://www.cybos.ai/cases/C-019
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "anyone running agents against numeric data"
type: case
version: v0.1
---
# Range-checker utility (anti-hallucination guardrail)

> LLMs confidently flunk "is 47 between 40 and 50?" 20 lines of Python + one rule in.cursorrules eliminates a whole class of bugs.

## What

A ~20-line Python script `check_range.py` that takes (value, min, max) triples. Root `.cursorrules` enforces: "ALWAYS use this script for numerical comparisons — NEVER do mental math for ranges. LLMs frequently make errors with numerical comparisons." Tiny tool, large class of bugs eliminated.
