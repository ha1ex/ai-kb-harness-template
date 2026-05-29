---
id: B-062
tier: B
category: "Founder productivity"
kind: pattern
title: "Sales pipeline data extraction — durable entities"
subtitle: "Same call gets re-analysed dozens of times — paid tokens plus drift risk each time. Extract decisions + commitments once, reuse forever."
source: https://www.cybos.ai/cases/B-062
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "sales lead · founder · account exec"
type: case
version: v0.1
---
# Sales pipeline data extraction — durable entities

> Same call gets re-analysed dozens of times — paid tokens plus drift risk each time. Extract decisions + commitments once, reuse forever.

## What

Stop feeding the agent raw call transcripts every time you ask about a deal. Instead, after each call, run a one-time extraction that pulls out durable entities: decision-maker contact info, role, decision criteria, agreements made, objections, next-step commitments. These entities live as structured markdown files per deal, per contact. Future operations read the entity store, not the transcript.

## Why it matters

On a B2B sales motion with long decision chains, the same call gets re-analyzed dozens of times — for next-step prep, for handoff to CS, for the renewal motion six months later. Each re-analysis is paid LLM tokens plus drift risk. A B2B sales practitioner reports: "Why repeat the same computations every time?" Extracting once and reusing across operations also lets you spot cross-cycle signals — "this decision-maker moved to a new company; that's a cross-sell signal" — that pure transcript-on-demand workflows miss.

## End-to-end

1. **Define the entity schema** for your sales motion. Typical fields: company, contact name, role, channel, last_call_date, decision_criteria[], objections[], commitments[], status.
2. **Write a one-shot extraction prompt** that reads a transcript and emits the schema as YAML / markdown.
3. **Save extracts as `deals/{Company}.md` and `contacts/{Name}.md`** keyed by stable IDs.
4. **Build a per-deal merge step** that updates existing entities when a new call comes in — never overwrite history; append timestamped diffs.
5. **Wire downstream skills to read entities, not transcripts.** "Next-step recommendation," "renewal-readiness scoring," "handoff brief" all consume the structured files.
6. **Periodically re-scan**: did any contact move companies? Cross-sell signal.

## Gotchas

- Schema drift between sales reps. Lock the schema in one markdown file; if a rep wants a new field, they amend the schema, not their personal extracts.

## Tools

- Transcription pipeline (existing)
- Vault with deals/ and contacts/ folders
- A schema doc shared across the sales team
