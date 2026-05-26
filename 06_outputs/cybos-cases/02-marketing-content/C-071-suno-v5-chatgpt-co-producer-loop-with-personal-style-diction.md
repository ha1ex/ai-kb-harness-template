---
id: C-071
tier: C
category: "Marketing & content"
kind: workflow
title: "Suno v5 + ChatGPT co-producer loop with personal style dictionary"
subtitle: "Problem solved: vanilla Suno generations miss the operator's intended sound; raw lyric prompts under-specify style."
source: https://www.cybos.ai/cases/C-071
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Suno v5 + ChatGPT co-producer loop with personal style dictionary

> Problem solved: vanilla Suno generations miss the operator's intended sound; raw lyric prompts under-specify style.

## What

Workflow: draft lyrics in ChatGPT, refine line-by-line to word-level precision. Pick a base style; generate in Suno v5. When a take is off, paste the result into a ChatGPT chat scoped as "sound producer" — ask for revised style descriptors and Suno markup. Paste the new markup back into Suno. Maintain a private dictionary of style-descriptor blocks that work for you (typically 3-4 words, many takes). Do not crank style-strength to 100% — leave room for variation. One operator reports 31 publishable tracks in a week.
