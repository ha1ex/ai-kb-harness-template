---
id: C-080
tier: C
category: "Operations"
kind: tactic
title: "Migrate agent prompts from non-English to English for 30-40% token savings"
subtitle: "Problem solved: Non-English-speaking teams burn unnecessary tokens because LLM tokenizers are optimised for English vocabulary."
source: https://www.cybos.ai/cases/C-080
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Migrate agent prompts from non-English to English for 30-40% token savings

> Problem solved: Non-English-speaking teams burn unnecessary tokens because LLM tokenizers are optimised for English vocabulary.

## What

Operators benchmarked: rewriting CLAUDE.md, skills, and recurring prompts in English produced ~30-40% token reduction at equal task output — "language-agnostic", a tokenization effect, not a model-quality effect. Pairs naturally with caveman-style verbosity caps.
