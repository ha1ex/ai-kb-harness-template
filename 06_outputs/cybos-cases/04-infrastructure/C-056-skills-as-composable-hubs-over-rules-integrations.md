---
id: C-056
tier: C
category: "Infrastructure"
kind: pattern
title: "Skills as composable hubs over rules + integrations"
subtitle: "Baking MCP wiring into every skill means every skill breaks when the MCP changes. Point skills at external rule files; one update fixes all of them."
source: https://www.cybos.ai/cases/C-056
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "skill author"
type: case
version: v0.1
---
# Skills as composable hubs over rules + integrations

> Baking MCP wiring into every skill means every skill breaks when the MCP changes. Point skills at external rule files; one update fixes all of them.

## What

A "skill" is a small Claude/Codex package that combines rules + contexts + MCPs + prompts, invoked by `/skill-name`. Architectural rule: point the skill at an external rule file rather than baking everything inside — when an MCP changes, only the rule needs updating, not every skill that uses it.
