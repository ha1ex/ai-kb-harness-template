---
id: C-084
tier: C
category: "Engineering productivity"
kind: tactic
title: "Pre-load a language-specific `BESTPRACTICE.md` before vibe-coding niche languages"
subtitle: "Problem solved: Coding agents produce mediocre first-shot output in less-mainstream languages (anything outside the top tier of training-data coverage); a pre-loaded best-practices doc lifts first-pass quality dramatically."
source: https://www.cybos.ai/cases/C-084
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "founder / engineer working outside mainstream stacks"
type: case
version: v0.1
---
# Pre-load a language-specific `BESTPRACTICE.md` before vibe-coding niche languages

> Problem solved: Coding agents produce mediocre first-shot output in less-mainstream languages (anything outside the top tier of training-data coverage); a pre-loaded best-practices doc lifts first-pass quality dramatically.

## What

Run a deep-research pass on "best practices for <language>, including competitive-programming idioms", save the result as `BESTPRACTICE.md` at repo root, and let Claude/Codex read it before writing any code. One operator reported "first-shot output is immediately good" after adding this step.
