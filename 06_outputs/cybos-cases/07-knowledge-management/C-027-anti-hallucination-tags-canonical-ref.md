---
id: C-027
tier: C
category: "Knowledge management"
kind: pattern
title: "Anti-hallucination tags `[CANONICAL]` / `[REF:]`"
subtitle: "\"Where did this fact come from?\" has no answer six weeks later. Every statement is either canonical or a pointer; traceable provenance always."
source: https://www.cybos.ai/cases/C-027
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "vault owner"
type: case
version: v0.1
---
# Anti-hallucination tags `[CANONICAL]` / `[REF:]`

> "Where did this fact come from?" has no answer six weeks later. Every statement is either canonical or a pointer; traceable provenance always.

## What

Every statement in the vault is either `[CANONICAL]` (the first declaration of a fact) or `[REF: folder/file.md#section]` (a pointer to the canonical version). Inline tags inside files give the agent traceable provenance for every claim it surfaces.
