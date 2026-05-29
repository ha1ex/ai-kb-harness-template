---
id: C-060
tier: C
category: "Infrastructure"
kind: strategy
title: "Knowledge-graph + Quality-as-a-Service stack (judge-LLM + GEPA + DeepEval)"
subtitle: "Advanced operators want eval + prompt optimization + hallucination checks across every internal tool. One QaaS API any tool can call."
source: https://www.cybos.ai/cases/C-060
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "XL · Half-year+"
for: "engineering lead · infra operator"
type: case
version: v0.1
---
# Knowledge-graph + Quality-as-a-Service stack (judge-LLM + GEPA + DeepEval)

> Advanced operators want eval + prompt optimization + hallucination checks across every internal tool. One QaaS API any tool can call.

## What

Two backend services run by a single advanced operator: (1) graph backend storing/querying a knowledge graph with multiple query methods (NiFi-like pipeline framework); (2) Quality-as-a-Service API exposing forced telemetry capture, judge-LLM routing across multiple frontier models, ground-truth annotation, GEPA prompt-optimization workers, and DeepEval hallucination checks. Any internal tool can call the QaaS API for eval/optimization.
