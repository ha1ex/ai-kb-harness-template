---
id: C-085
tier: C
category: "Engineering productivity"
kind: tactic
title: "Global port-registry CLI for parallel agents on the same machine"
subtitle: "Problem solved: When 4-6 agents run dev servers in parallel worktrees, agent B happily kills agent A's process to reclaim:3000; a shared registry hands out unique ports per project so they stop fighting."
source: https://www.cybos.ai/cases/C-085
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "engineer running parallel agents locally"
type: case
version: v0.1
---
# Global port-registry CLI for parallel agents on the same machine

> Problem solved: When 4-6 agents run dev servers in parallel worktrees, agent B happily kills agent A's process to reclaim:3000; a shared registry hands out unique ports per project so they stop fighting.

## What

Install `port-registry` (`brew install n3r/tap/port-registry`), then `portctl skill install` to register it as a Claude/Codex skill. Each agent asks the registry for a free port keyed to its project/worktree; the registry tracks assignments globally. Works for both Claude Code and Codex out of the box.
