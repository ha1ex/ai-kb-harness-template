---
id: B-139
tier: B
category: "Knowledge management"
kind: workflow
title: "Long-context analytical synthesis over a transcript corpus — skip RAG"
subtitle: "Problem solved: Teams sitting on hundreds of sales-call or interview transcripts default to building a RAG pipeline; for global synthesis (patterns, fears, triggers), a 20-minute summarize-then-load workflow beats it."
source: https://www.cybos.ai/cases/B-139
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · sales lead · CS lead · head of research"
type: case
version: v0.1
---
# Long-context analytical synthesis over a transcript corpus — skip RAG

> Problem solved: Teams sitting on hundreds of sales-call or interview transcripts default to building a RAG pipeline; for global synthesis (patterns, fears, triggers), a 20-minute summarize-then-load workflow beats it.

## What

For a corpus of ~350 sales-call transcripts where the goal is global synthesis (themes, fears, recurring triggers, swear words) rather than fact lookup, **don't build RAG**. Store each call as plain text, generate a per-call summary with a cheap model (Haiku-class), then concatenate all summaries into a single Sonnet/Opus context and ask analytical questions directly. End-to-end work: ~20 minutes.

## Why it matters

RAG over a few-hundred-call corpus is the wrong tool: chunking debates, embedding quality concerns, retrieval-tuning loops — all of it overhead for a workload where the right answer is "load everything and ask." Skipping RAG removes weeks of pipeline work and produces better synthesis because the model sees the full corpus.

## End-to-end

1. **Store each call as a plain text file with light markup.** One folder.
2. **Generate a script (in Cursor or Claude Code) that walks the folder** and runs a fixed questionnaire per call using a Haiku-class model.
3. **Track processed files** in a `processed.txt` so re-runs only handle new transcripts.
4. **Concatenate the per-call summaries** into a single bundle. For ~350 short summaries this fits in a 200k context window.
5. **Hand the bundle to Sonnet or Opus** and ask analytical questions: "What worries customers? Recurring themes? Words they use repeatedly?"
6. **For an ongoing pipeline:** trigger the script on new files dropped in the folder.

## Gotchas

- **Only works while the bundle fits in context.** ~350 short summaries fits comfortably in 200k tokens. Past ~1,000 calls or with longer summaries, you'll hit the wall and chunking returns. At that scale, add metadata (country, role, company size) so you can stratify queries instead of forcing all summaries through one pass.

<hr/>

## Tools

- Plain text storage (no DB, no vector store)
- Cursor or Claude Code for script generation
- A Haiku-class model for cheap per-call summarization
- Sonnet or Opus for the final analytical pass
