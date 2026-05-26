---
id: C-017
tier: C
category: "Engineering productivity"
kind: tactic
title: "Linters as agent guardrails"
subtitle: "Iterations are wasted on lint-class errors the agent then has to fix. Add \"use a linter\" to the kickoff prompt; auto-fix on every edit."
source: https://www.cybos.ai/cases/C-017
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "any agent user"
type: case
version: v0.1
---
# Linters as agent guardrails

> Iterations are wasted on lint-class errors the agent then has to fix. Add "use a linter" to the kickoff prompt; auto-fix on every edit.

## What

Add "use a linter" to the kickoff prompt. The agent sets up linting up front; subsequent edits auto-fix simple errors and fewer iterations are spent on lint-class mistakes.
