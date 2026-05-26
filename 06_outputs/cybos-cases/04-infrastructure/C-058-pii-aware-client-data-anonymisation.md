---
id: C-058
tier: C
category: "Infrastructure"
kind: pattern
title: "PII-aware client-data anonymisation"
subtitle: "Regulated industries can't send raw HR/client data to cloud LLMs. Deterministic anonymisation pre-flight; never rely on the model to redact."
source: https://www.cybos.ai/cases/C-058
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "L · Quarter"
for: "CISO · data engineer in regulated industry"
type: case
version: v0.1
---
# PII-aware client-data anonymisation

> Regulated industries can't send raw HR/client data to cloud LLMs. Deterministic anonymisation pre-flight; never rely on the model to redact.

## What

Pipeline that anonymises HR / client data before sending it to external models — required for any regulated industry workflow under data residency regulation. Treats anonymisation as a deterministic pre-flight stage, not a model-level guarantee.
