---
id: C-098
tier: C
category: "Engineering productivity"
kind: pattern
title: "Session-ID hook stamps every artifact with its session identifier"
subtitle: "Problem solved: months later, you can open a doc, find a session ID inside, and rehydrate the exact agent session that produced it."
source: https://www.cybos.ai/cases/C-098
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Session-ID hook stamps every artifact with its session identifier

> Problem solved: months later, you can open a doc, find a session ID inside, and rehydrate the exact agent session that produced it.

## What

A SessionStart hook in Claude Code writes a unique session ID into the agent's env; CLAUDE.md instructs the agent to embed that ID in the front-matter of every file it creates or modifies. Trivial to implement, high payoff for long-running projects.
