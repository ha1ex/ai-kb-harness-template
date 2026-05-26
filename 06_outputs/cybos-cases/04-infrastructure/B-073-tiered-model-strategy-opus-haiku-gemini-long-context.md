---
id: B-073
tier: B
category: "Infrastructure"
kind: pattern
title: "Tiered model strategy — Opus / Haiku / Gemini long-context"
subtitle: "Running everything on Opus is the largest single cost in any LLM pipeline. Cheap classifier, mid synthesis, long-context retrieval — 10× savings."
source: https://www.cybos.ai/cases/B-073
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · founder · anyone running multi-step LLM pipelines"
type: case
version: v0.1
---
# Tiered model strategy — Opus / Haiku / Gemini long-context

> Running everything on Opus is the largest single cost in any LLM pipeline. Cheap classifier, mid synthesis, long-context retrieval — 10× savings.

## What

A simple per-task model-routing policy that swaps cost and capability without overthinking it:

- **Opus**: deep reasoning, autonomous research with WebSearch + Bash, agentic tasks with tool calls. Where quality matters and you can afford 25 turns at $X.
- **Haiku** (or Sonnet on the Max plan): classifiers, extractors, structured-output prompts at batch scale. Fast, cheap, good enough for L1 binary decisions.
- **Gemini 2.5 Flash long-context**: million-token retrieval over piles of meeting transcripts / docs / past sessions. 3¢/M tokens makes "stuff everything into context" cheaper than building RAG.

A founder-discovery CLI runs L1 (Sonnet, batches of 5 tweets) → L2 (Sonnet, one call per GO) → L3 (Opus + WebSearch + Bash, ~25 turns). One reference deployment uses Gemini long-context for "where did I talk about X across 50 sessions" instead of embeddings.

## Why it matters

Choosing the right model per step is the largest single cost lever in any LLM pipeline. A 10× cost difference between Opus and Haiku per task, applied across thousands of L1 classifications, dwarfs every other optimization. Long-context Gemini for retrieval often beats embedding pipelines on quality and total cost-to-build.

## End-to-end

1. **For each step in your pipeline, name the smallest model that passes your evals.** Default down to Haiku unless quality fails.
2. **Reserve Opus for steps with tool use, multi-turn reasoning, or business-critical outputs** (final emails, deep memos, plan generation).
3. **Where you'd reach for embeddings + RAG, try Gemini long-context first.** Dump 500K tokens of relevant sessions; ask the question; check cost vs build time.
4. **Maintain a one-pager `models.md`** listing each step → model with rationale. Re-test quarterly as models improve.
5. **On Claude Max plan**, the cost gradient flattens — but rate limits don't, so Haiku-for-batch still matters.

## Gotchas

- "Always use Opus" wastes 10× of budget at scale; "always use Haiku" silently degrades the outputs you actually care about. Test, don't assume.

## Tools

- API access to Claude (Opus + Sonnet + Haiku) and Gemini
- Per-step eval set (10–50 examples with expected outputs)
