---
id: C-024
tier: C
category: "Data & BI"
kind: pattern
title: "Dual-mode retrieval (full-text + Gemini long-context)"
subtitle: "RAG embedding pipelines drift and miss context. Brute-force everything into Gemini 2.5 Flash's 1M context at 3¢/M tokens often wins on quality."
source: https://www.cybos.ai/cases/C-024
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
for: "data engineer · retrieval engineer"
type: case
version: v0.1
---
# Dual-mode retrieval (full-text + Gemini long-context)

> RAG embedding pipelines drift and miss context. Brute-force everything into Gemini 2.5 Flash's 1M context at 3¢/M tokens often wins on quality.

## What

Two retrieval algorithms A/B-tested against each other: (a) full-text + Leiden clustering, (b) brute-force dump everything into Gemini 2.5 Flash's million-token context. Skeptical of embeddings/RAG; the long-context option is cheap enough at 3¢/M tokens to win in practice.
