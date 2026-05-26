---
id: B-132
tier: B
category: "Engineering productivity"
kind: pattern
title: "AGENTS.md mapping — make Codex consume Claude-format skills for cross-provider hedging"
subtitle: "Problem solved: Teams want one skill library that works across Claude and Codex; an AGENTS.md mapping file at project root lets Codex discover and consume skills authored in Claude's format."
source: https://www.cybos.ai/cases/B-132
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineering leads hedging across model providers"
type: case
version: v0.1
---
# AGENTS.md mapping — make Codex consume Claude-format skills for cross-provider hedging

> Problem solved: Teams want one skill library that works across Claude and Codex; an AGENTS.md mapping file at project root lets Codex discover and consume skills authored in Claude's format.

## What

Author your skills once in Claude's format in `.claude/skills/`, then drop an `AGENTS.md` at the project root that points Codex's skill-discovery mechanism at those same files. Codex picks them up, runs them, and — in at least one operator's testing — out-disciplines Claude itself on tasks like git-flow ("Codex isolated worktree per task without fail; Claude skipped it ~50% of the time"). Same library, two providers, less drift.

## Why it matters

Hedging across providers is a real operational requirement (rate-limit incidents, pricing changes, model regressions). Without shared skills, hedging means maintaining two skill libraries with two formats — a tax most teams won't pay, so they end up locked in. AGENTS.md collapses the cost. Pairs with the hierarchical CLAUDE.md / AGENTS.md three-tier pattern.

## End-to-end

1. Author skills in Claude's format inside `.claude/skills/<skill-name>/SKILL.md` (one folder per skill).
2. At project root, create `AGENTS.md`. Map each skill: name, trigger conditions, path to the Claude `SKILL.md` file, any Codex-specific glue notes.
3. Point Codex at the project; verify it discovers the mapped skills (Codex's own skill listing should show them).
4. Pick one concrete task with a strong workflow signal (git-flow, test-then-commit) and run it through both Claude and Codex with the shared library. This is your regression baseline.
5. When you add new skills, update both `.claude/skills/` (canonical) and `AGENTS.md` (mapping). Treat AGENTS.md as the cross-provider compat layer, not a second source of truth.

## Gotchas

## Claude actively apologizes for skipping its own rules — "oh, I kinda forgot, sorry, I'll do it all now" — but the skip happens often enough that an operator running this comparison reports Codex with mapped Claude skills outperforms Claude on workflow discipline. Don't read that as "Codex is better"; read it as "skill compliance is the bottleneck, and Codex enforces it more reliably on at least one workflow class." Validate on your own task mix before defaulting to Codex.

## Tools

- Claude Code with skills in `.claude/skills/`
- Codex CLI (or a Codex-compatible harness)
- `AGENTS.md` at project root
