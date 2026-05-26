---
id: C-047
tier: C
category: "Infrastructure"
kind: pattern
title: "Prompt files as the only \"config that matters\""
subtitle: "Classifier prompts buried in Python need a deploy to iterate. Move to prompts/*.txt and an inline /context editor; iterate daily without a deploy."
source: https://www.cybos.ai/cases/C-047
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "any team running an LLM classifier in production"
type: case
version: v0.1
---
# Prompt files as the only "config that matters"

> Classifier prompts buried in Python need a deploy to iterate. Move to prompts/*.txt and an inline /context editor; iterate daily without a deploy.

## What

L1/L2/L3 classifier logic lives in `prompts/*.txt`, not in Python. The internal dashboard's `/context` page edits prompts inline so non-engineers can iterate on the classifier without a deploy. Separates prompt-iteration cadence (daily) from code-deploy cadence (weekly).
