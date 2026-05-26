---
id: B-121
tier: B
category: "Engineering productivity"
kind: workflow
title: "Production eval — criteria DB + LLM judge on sampled traces"
subtitle: "Problem solved: Non-deterministic AI workflows in production drift silently; without a continuous eval pipeline, regressions only surface in customer complaints."
source: https://www.cybos.ai/cases/B-121
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineer · AI/ML lead"
type: case
version: v0.1
---
# Production eval — criteria DB + LLM judge on sampled traces

> Problem solved: Non-deterministic AI workflows in production drift silently; without a continuous eval pipeline, regressions only surface in customer complaints.

## What

Build a markdown criteria database — FAQ, golden logic, known issues, error catalogue, concrete test cases — then sample N production traces per day or week and pipe `(trace + criteria)` into a top-tier model as a judge with the instruction: "find regressions, contradictions, missed steps." Review the resulting report by hand; whenever a new failure mode shows up, add it to the criteria DB. Re-run the same loop after every model upgrade or pipeline change.

## Why it matters

Catches obvious regressions cheaply. Rarely catches novel failure modes — but it's the only practical way to monitor probabilistic systems at scale. Especially important right after deploying new functionality, when the criteria DB itself needs to be extended.

## End-to-end

1. Write the criteria DB as plain markdown: FAQ, expected logic, known issues, error catalogue, test cases.
2. Add trace logging to production with enough context per trace for an LLM to evaluate it (inputs, intermediate steps, output, tool calls).
3. Sample traces (daily or weekly) — random or stratified by use-case.
4. Send each `(trace + criteria DB)` to Claude Opus or Gemini Pro as judge with a "find regressions" prompt; emit a structured report.
5. Review by hand; extend the criteria DB with newly discovered failure modes; re-run on the next sample.
6. For voice/conversational pipelines, split evals into three tracks: deterministic auto-checks (e.g. "did the agent call the right tool"), LLM-as-judge on conversation logs, and end-to-end manual walkthroughs with real voice. Bugs typically live in the middle (LLM) layer, not in STT/TTS.
7. For voice regression corpora, use ElevenLabs simulate-conversations to generate adversarial scripted conversations.

## Gotchas

- The LLM judge will miss novel failure modes — it can only catch what's described in the criteria DB. Schedule a monthly human pass over a fresh random sample to expand the DB; otherwise your evals will tell you "all green" while real users hit new bugs.

<hr/>

## Tools

- Trace logging in production with full context per call
- Claude or Gemini API for the judge step
- Promptfoo / Langfuse / OpenAI Evals for the prompt-tuning side of the same workflow
- For voice: ElevenLabs simulate-conversations, optional managed eval platforms
